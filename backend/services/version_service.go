package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"sync"
	"time"
)

// MojangVersionManifest represents the structure from Mojang's version manifest
type MojangVersionManifest struct {
	Latest struct {
		Release  string `json:"release"`
		Snapshot string `json:"snapshot"`
	} `json:"latest"`
	Versions []struct {
		ID          string    `json:"id"`
		Type        string    `json:"type"`
		URL         string    `json:"url"`
		Time        time.Time `json:"time"`
		ReleaseTime time.Time `json:"releaseTime"`
	} `json:"versions"`
}

// MinecraftVersion represents a simplified version for our API
type MinecraftVersion struct {
	ID          string `json:"id"`
	ReleaseDate string `json:"release_date"`
}

// VersionService handles fetching and caching Minecraft versions
type VersionService struct {
	mu              sync.RWMutex
	cachedVersions  []MinecraftVersion
	lastFetchTime   time.Time
	cacheExpiration time.Duration
}

const mojangVersionManifestURL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"

var (
	versionServiceInstance *VersionService
	versionServiceOnce     sync.Once
)

// GetVersionService returns the singleton instance of VersionService
func GetVersionService() *VersionService {
	versionServiceOnce.Do(func() {
		versionServiceInstance = &VersionService{
			cacheExpiration: 7 * 24 * time.Hour, // 1 week
		}
		// Fetch versions on initialization
		go versionServiceInstance.refreshVersionsIfNeeded()
	})
	return versionServiceInstance
}

// GetVersions returns the cached versions or fetches new ones if cache is expired
func (vs *VersionService) GetVersions() ([]MinecraftVersion, error) {
	vs.mu.RLock()
	// Check if cache is still valid
	if time.Since(vs.lastFetchTime) < vs.cacheExpiration && len(vs.cachedVersions) > 0 {
		versions := vs.cachedVersions
		vs.mu.RUnlock()
		return versions, nil
	}
	vs.mu.RUnlock()

	// Cache is expired or empty, fetch new versions
	return vs.refreshVersions()
}

// refreshVersionsIfNeeded checks and refreshes versions if needed
func (vs *VersionService) refreshVersionsIfNeeded() {
	vs.mu.RLock()
	needsRefresh := time.Since(vs.lastFetchTime) >= vs.cacheExpiration || len(vs.cachedVersions) == 0
	vs.mu.RUnlock()

	if needsRefresh {
		vs.refreshVersions()
	}
}

// refreshVersions fetches versions from Mojang and updates the cache
func (vs *VersionService) refreshVersions() ([]MinecraftVersion, error) {
	vs.mu.Lock()
	defer vs.mu.Unlock()

	// Double-check in case another goroutine already refreshed
	if time.Since(vs.lastFetchTime) < vs.cacheExpiration && len(vs.cachedVersions) > 0 {
		return vs.cachedVersions, nil
	}

	fmt.Println("Fetching Minecraft versions from Mojang API...")

	resp, err := http.Get(mojangVersionManifestURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch version manifest: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var manifest MojangVersionManifest
	if err := json.Unmarshal(body, &manifest); err != nil {
		return nil, fmt.Errorf("failed to parse version manifest: %w", err)
	}

	// Filter only release versions (not snapshots, betas, etc.)
	var versions []MinecraftVersion
	for _, v := range manifest.Versions {
		if v.Type == "release" {
			versions = append(versions, MinecraftVersion{
				ID:          v.ID,
				ReleaseDate: v.ReleaseTime.Format("2006-01-02"),
			})
		}
	}

	// Sort versions (they should already be sorted, but let's ensure it)
	sort.Slice(versions, func(i, j int) bool {
		return versions[i].ReleaseDate > versions[j].ReleaseDate
	})

	vs.cachedVersions = versions
	vs.lastFetchTime = time.Now()

	fmt.Printf("Successfully cached %d Minecraft versions\n", len(versions))

	return versions, nil
}

// StartAutoRefresh starts a background goroutine that refreshes versions weekly
func (vs *VersionService) StartAutoRefresh() {
	ticker := time.NewTicker(24 * time.Hour) // Check daily
	go func() {
		for range ticker.C {
			vs.refreshVersionsIfNeeded()
		}
	}()
	fmt.Println("Version auto-refresh service started (checks daily, refreshes weekly)")
}
