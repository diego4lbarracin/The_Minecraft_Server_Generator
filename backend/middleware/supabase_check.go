/*
supabase_check.go
Queries the Supabase REST API (PostgREST) to validate that the authenticated
user is approved and still has trial attempts remaining before letting a
request through the auth middleware.

Required environment variables:
  SUPABASE_URL              – e.g. https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY – service-role key (bypasses RLS so we can read any row)

The function queries the `profiles` table (adjust the constant below if your
table has a different name).
*/

package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// profilesTable is the PostgREST table that holds per-user access fields.
const profilesTable = "profiles"

// UserProfile contains only the fields we care about for access control.
type UserProfile struct {
	Approved                  bool `json:"approved"`
	TestServiceTrialAttempts  int  `json:"test_service_trial_attempts"`
	CustomServerTrialAttempts int  `json:"custom_server_trial_attempts"`
}

// fetchUserProfile retrieves a user's profile from Supabase by their auth UID.
// Returns an error if the user is not found or the request fails.
func fetchUserProfile(userID string) (*UserProfile, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" || serviceRoleKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured")
	}

	// Build the PostgREST query URL.
	// Selects only the 3 fields we need and filters by the user's UUID.
	url := fmt.Sprintf(
		"%s/rest/v1/%s?select=approved,test_service_trial_attempts,custom_server_trial_attempts&id=eq.%s",
		supabaseURL, profilesTable, userID,
	)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build Supabase request: %w", err)
	}

	// Both headers are required by Supabase PostgREST.
	req.Header.Set("apikey", serviceRoleKey)
	req.Header.Set("Authorization", "Bearer "+serviceRoleKey)
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to reach Supabase: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Supabase returned unexpected status %d", resp.StatusCode)
	}

	// PostgREST always returns an array even for a single-row filter.
	var profiles []UserProfile
	if err := json.NewDecoder(resp.Body).Decode(&profiles); err != nil {
		return nil, fmt.Errorf("failed to decode Supabase response: %w", err)
	}

	if len(profiles) == 0 {
		return nil, fmt.Errorf("user profile not found for ID %s", userID)
	}

	return &profiles[0], nil
}
