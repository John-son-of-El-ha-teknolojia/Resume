package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type ResumeSection struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type ResumeData struct {
	Name     string          `json:"name"`
	Email    string          `json:"email"`
	Phone    string          `json:"phone"`
	Location string          `json:"location"`
	Summary  string          `json:"summary"`
	Sections []ResumeSection `json:"sections"`
}

type Subscription struct {
	Tier    string    `json:"tier"`
	Expires time.Time `json:"expires"`
	Amount  float64   `json:"amount"`
}

var (
	subscriptions   = make(map[string]Subscription)
	downloadTracker = make(map[string]bool)
)

func main() {
	mux := http.NewServeMux()

	// Authentication
	mux.HandleFunc("/api/auth/login", handleLogin)

	// Admin Stats
	mux.HandleFunc("/api/admin/stats", handleAdminStats)

	// AI Enhancement
	mux.HandleFunc("/api/ai/enhance", handleAIEnhance)

	// Resume Operations
	mux.HandleFunc("/api/resume/extract", handleResumeExtract)
	mux.HandleFunc("/api/resume/check-eligibility", handleCheckEligibility)
	mux.HandleFunc("/api/resume/pdf", handleResumePDF)

	// Payment
	mux.HandleFunc("/api/payment/initiate", handlePaymentInitiate)

	// Static files (placeholder for Angular build)
	mux.Handle("/", http.FileServer(http.Dir("./dist/browser")))

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Printf("Go Server starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	isAdmin := body.Email == "curtisombai@gmail.com"

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"email":   body.Email,
		"isAdmin": isAdmin,
	})
}

func handleAdminStats(w http.ResponseWriter, r *http.Request) {
	// Simplified stats for now
	tierCounts := map[string]int{"3days": 0, "1month": 0, "1year": 0}
	var revenue float64

	for _, sub := range subscriptions {
		revenue += sub.Amount
		tierCounts[sub.Tier]++
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"totalUsers":   len(subscriptions),
		"activeUsers":  len(subscriptions), // Simplified
		"totalRevenue": revenue,
		"tierCounts":   tierCounts,
	})
}

func handleAIEnhance(w http.ResponseWriter, r *http.Request) {
	var body struct {
		SectionText string `json:"sectionText"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		json.NewEncoder(w).Encode(map[string]string{
			"improvedText": body.SectionText + " (Mock: API Key missing)",
		})
		return
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-1.5-flash")
	resp, err := model.GenerateContent(ctx, genai.Text("Improve this resume section: "+body.SectionText))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Simple extraction of the first candidate's first part
	// In production, be more careful with indexing
	improved := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])

	json.NewEncoder(w).Encode(map[string]string{
		"improvedText": improved,
	})
}

func handleResumeExtract(w http.ResponseWriter, r *http.Request) {
	// Mock extraction
	data := ResumeData{
		Name:     "Jonathan Doe",
		Email:    "jonathan.doe@example.com",
		Phone:    "+254 700 123 456",
		Location: "Nairobi, Kenya",
		Summary:  "Go Developer and Cloud Architect.",
		Sections: []ResumeSection{
			{ID: "exp1", Title: "Experience", Content: "Simulated extraction content."},
		},
	}
	json.NewEncoder(w).Encode(data)
}

func handleCheckEligibility(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	sub, ok := subscriptions[body.Email]
	isPremium := ok && sub.Expires.After(time.Now())
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"canDownload":         true,
		"isPremium":           isPremium,
		"hasFreeDownloadLeft": true,
	})
}

func handlePaymentInitiate(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Amount float64 `json:"amount"`
		Email  string  `json:"email"`
		Tier   string  `json:"tier"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	var duration time.Duration
	switch body.Tier {
	case "3days":
		duration = 3 * 24 * time.Hour
	case "1month":
		duration = 30 * 24 * time.Hour
	case "1year":
		duration = 365 * 24 * time.Hour
	}

	subscriptions[body.Email] = Subscription{
		Tier:    body.Tier,
		Expires: time.Now().Add(duration),
		Amount:  body.Amount,
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       true,
		"transactionId": "GO" + fmt.Sprint(time.Now().Unix()),
	})
}

func handleResumePDF(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=resume.pdf")
	w.Write([]byte("%PDF-1.4\n1 0 obj\n<< /Title (Go Resume) >>\nendobj\n%%EOF"))
}
