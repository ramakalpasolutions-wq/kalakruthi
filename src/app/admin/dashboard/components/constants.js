export const MENU = [
  "Dashboard",
  "Packages",
  "Quotation",
  "Gallery",
  "Hero Section",
  "Services",
  "Customer Details"
]

export const SERVICES_BY_EVENT = {
  "Birthday": [
    { name: "Traditional Photography", amount: 15000 },
    { name: "Traditional Videography", amount: 15000 },
    { name: "Candid Photography", amount: 12000 },
    { name: "Candid Videography", amount: 12000 },
    { name: "Drone", amount: 8000 },
    { name: "Live Streaming", amount: 10000 },
    { name: "LED Walls", amount: 20000 },
    // ... other services
  ],
  "Mature Function": [
    { name: "Traditional Photography", amount: 15000 },
    { name: "Traditional Videography", amount: 15000 },
    { name: "Candid Photography", amount: 12000 },
    { name: "Candid Videography", amount: 12000 },
    { name: "Drone", amount: 8000 },
    { name: "Live Streaming", amount: 10000 },
    { name: "LED Walls", amount: 20000 },
    // ... other services
  ],
  "PrePost Wedding": [
    { name: "Traditional Photography", amount: 15000 },
    { name: "Traditional Videography", amount: 15000 },
    { name: "Candid Photography", amount: 12000 },
    { name: "Candid Videography", amount: 12000 },
    { name: "Drone", amount: 8000 },
    { name: "Live Streaming", amount: 10000 },
    { name: "LED Walls", amount: 20000 },
    // ... other services
  ],
  "Engagement": [
   { name: "Traditional Photography", amount: 15000 },
    { name: "Traditional Videography", amount: 15000 },
    { name: "Candid Photography", amount: 12000 },
    { name: "Candid Videography", amount: 12000 },
    { name: "Drone", amount: 8000 },
    { name: "Live Streaming", amount: 10000 },
    { name: "LED Walls", amount: 20000 },
    // ... other services
  ],
  "Marriage": [
    { name: "Traditional Photography", amount: 15000 },
    { name: "Traditional Videography", amount: 15000 },
    { name: "Candid Photography", amount: 12000 },
    { name: "Candid Videography", amount: 12000 },
    { name: "Drone", amount: 8000 },
    { name: "Live Streaming", amount: 10000 },
    { name: "LED Walls", amount: 20000 },
    // ... other services
  ],
  "Reception": [
    { name: "Traditional Photography", amount: 15000 },
    { name: "Traditional Videography", amount: 15000 },
    { name: "Candid Photography", amount: 12000 },
    { name: "Candid Videography", amount: 12000 },
    { name: "Drone", amount: 8000 },
    { name: "Live Streaming", amount: 10000 },
    { name: "LED Walls", amount: 20000 },
    // ... other services
  ],
  
}

export const formatAmount = (amount) => {
  if (!amount || isNaN(amount)) return "0"
  return parseInt(amount).toLocaleString("en-IN")
}
