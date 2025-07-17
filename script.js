// ✅ Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAaeQO6TV80UONELW8Ipme10jAFf1PF7Pg",
  authDomain: "stlouis-apartments.firebaseapp.com",
  projectId: "stlouis-apartments",
  storageBucket: "stlouis-apartments.firebasestorage.app",
  messagingSenderId: "36017472787",
  appId: "1:36017472787:web:225fb6679bd1a6fe1c46e6",
  measurementId: "G-7LF9KB36WT"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Application State
let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
const payments = JSON.parse(localStorage.getItem("payments")) || [];
let currentTheme = localStorage.getItem("theme") || "light";

// Room Configuration
const ROOMS = {
  bedsitters: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10"],
  oneBedroom: ["G1", "G2", "G3", "G4", "G5", "G6", "G7"],
};

const RENT_PRICES = {
  bedsitters: 5500,
  oneBedroom: 6500,
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  initializeYearSelects();
  populateRoomSelects();
  updateDashboard();
  updateTenantTables();
  updatePaymentTable();
  updateRoomStatus();
});

// Theme Management
function initializeTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme)
  updateThemeIcon()
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light"
  document.documentElement.setAttribute("data-theme", currentTheme)
  localStorage.setItem("theme", currentTheme)
  updateThemeIcon()
}

function updateThemeIcon() {
  const themeIcon = document.querySelector(".theme-icon")
  themeIcon.textContent = currentTheme === "light" ? "🌙" : "☀️"
}

// Navigation
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active")
  })

  // Remove active class from all nav buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Show selected section
  document.getElementById(sectionId).classList.add("active")

  // Add active class to clicked nav button
  event.target.classList.add("active")
}

// Initialize Year Selects
function initializeYearSelects() {
  const currentYear = new Date().getFullYear()
  const yearSelects = ["paymentYear", "receiptYear"]

  yearSelects.forEach((selectId) => {
    const select = document.getElementById(selectId)
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      const option = document.createElement("option")
      option.value = year
      option.textContent = year
      if (year === currentYear) option.selected = true
      select.appendChild(option)
    }
  })
}

// Populate Room Selects
function populateRoomSelects() {
  const roomSelects = ["roomNumber", "paymentRoom", "receiptRoom"]

  roomSelects.forEach((selectId) => {
    const select = document.getElementById(selectId)
    select.innerHTML = '<option value="">Select Room</option>'

    // Add bedsitter rooms
    ROOMS.bedsitters.forEach((room) => {
      const option = document.createElement("option")
      option.value = room
      option.textContent = `${room} (Bedsitter - KSh 5,500)`
      select.appendChild(option)
    })

    // Add one bedroom rooms
    ROOMS.oneBedroom.forEach((room) => {
      const option = document.createElement("option")
      option.value = room
      option.textContent = `${room} (One Bedroom - KSh 6,500)`
      select.appendChild(option)
    })
  })
}

// Tenant Management
function showAddTenantForm() {
  document.getElementById("addTenantForm").style.display = "block"
  updateAvailableRooms()
}

function hideAddTenantForm() {
  document.getElementById("addTenantForm").style.display = "none"
  document.getElementById("tenantForm").reset()
}

function updateAvailableRooms() {
  const roomSelect = document.getElementById("roomNumber")
  const occupiedRooms = tenants.map((tenant) => tenant.roomNumber)

  roomSelect.innerHTML = '<option value="">Select Room</option>'

  // Add available bedsitter rooms
  ROOMS.bedsitters.forEach((room) => {
    if (!occupiedRooms.includes(room)) {
      const option = document.createElement("option")
      option.value = room
      option.textContent = `${room} (Bedsitter - KSh 5,500)`
      roomSelect.appendChild(option)
    }
  })

  // Add available one bedroom rooms
  ROOMS.oneBedroom.forEach((room) => {
    if (!occupiedRooms.includes(room)) {
      const option = document.createElement("option")
      option.value = room
      option.textContent = `${room} (One Bedroom - KSh 6,500)`
      roomSelect.appendChild(option)
    }
  })
}

// Tenant Form Submission
document.getElementById("tenantForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const tenant = {
    id: Date.now(),
    fullName: document.getElementById("fullName").value,
    idNumber: document.getElementById("idNumber").value,
    phoneNumber: document.getElementById("phoneNumber").value,
    email: document.getElementById("email").value,
    roomNumber: document.getElementById("roomNumber").value,
    dateAdded: new Date().toISOString(),
  };

  // ✅ Save to Firestore
  db.collection("tenants")
    .add(tenant)
    .then(() => {
      console.log("Tenant saved to Firebase");

      // ✅ Save locally
      tenants.push(tenant);
      localStorage.setItem("tenants", JSON.stringify(tenants));

      // ✅ UI updates
      updateTenantTables();
      updateDashboard();
      updateRoomStatus();
      hideAddTenantForm();

      alert("Tenant added successfully!");
    })
    .catch((error) => {
      console.error("❌ Error saving to Firebase:", error);
      alert("Failed to save tenant to Firebase. Check console for details.");
    });
});


// Update Tenant Tables
function updateTenantTables() {
  const bedsitterTableBody = document.querySelector("#bedsitterTable tbody")
  const oneBedroomTableBody = document.querySelector("#oneBedroomTable tbody")

  bedsitterTableBody.innerHTML = ""
  oneBedroomTableBody.innerHTML = ""

  tenants.forEach((tenant) => {
    const row = createTenantRow(tenant)

    if (ROOMS.bedsitters.includes(tenant.roomNumber)) {
      bedsitterTableBody.appendChild(row)
    } else if (ROOMS.oneBedroom.includes(tenant.roomNumber)) {
      oneBedroomTableBody.appendChild(row)
    }
  })
}

// Update the createTenantRow function to improve button visibility
function createTenantRow(tenant) {
  const row = document.createElement("tr")
  row.innerHTML = `
        <td>${tenant.roomNumber}</td>
        <td>${tenant.fullName}</td>
        <td>${tenant.idNumber}</td>
        <td>${tenant.phoneNumber}</td>
        <td>${tenant.email || "N/A"}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-danger" onclick="removeTenant(${tenant.id})" title="Remove Tenant">
                    Remove
                </button>
            </div>
        </td>
    `
  return row
}

function removeTenant(tenantId) {
  if (confirm("Are you sure you want to remove this tenant?")) {
    tenants = tenants.filter((tenant) => tenant.id !== tenantId)
    localStorage.setItem("tenants", JSON.stringify(tenants))

    updateTenantTables()
    updateDashboard()
    updateRoomStatus()
  }
}

// Payment Management
// Enhanced payment processing to handle balance clearing
document.getElementById("paymentForm").addEventListener("submit", (e) => {
  e.preventDefault()

  const roomNumber = document.getElementById("paymentRoom").value
  const tenant = tenants.find((t) => t.roomNumber === roomNumber)

  if (!tenant) {
    alert("No tenant found for this room!")
    return
  }

  const roomType = ROOMS.bedsitters.includes(roomNumber) ? "bedsitters" : "oneBedroom"
  const rentAmount = RENT_PRICES[roomType]
  const amountPaid = Number.parseFloat(document.getElementById("amountPaid").value)
  const month = document.getElementById("paymentMonth").value
  const year = document.getElementById("paymentYear").value

  // Check for existing payment for this month/year
  const existingPayment = payments.find((p) => p.roomNumber === roomNumber && p.month === month && p.year === year)

  let totalPaid = amountPaid
  let previousBalance = rentAmount

  if (existingPayment) {
    // If there's an existing payment, add to it
    totalPaid = existingPayment.amountPaid + amountPaid
    previousBalance = existingPayment.balance + amountPaid

    // Remove the existing payment record
    const index = payments.findIndex((p) => p.id === existingPayment.id)
    if (index > -1) {
      payments.splice(index, 1)
    }
  }

  const finalBalance = rentAmount - totalPaid
  const isFullyPaid = finalBalance <= 0

  const payment = {
    id: Date.now(),
    roomNumber: roomNumber,
    tenantId: tenant.id,
    tenantName: tenant.fullName,
    month: month,
    year: year,
    amountPaid: totalPaid,
    currentPayment: amountPaid, // Track just this payment
    rentAmount: rentAmount,
    balance: Math.max(0, finalBalance), // Don't show negative balance
    paymentMethod: document.getElementById("paymentMethod").value,
    date: new Date().toISOString(),
    isFullyPaid: isFullyPaid,
    previousBalance: existingPayment ? existingPayment.balance : rentAmount,
  }

  payments.push(payment)
localStorage.setItem("payments", JSON.stringify(payments))

// ✅ Save payment to Firestore
db.collection("payments").add(payment)
  .then(() => {
    console.log("✅ Payment saved to Firebase")
  })
  .catch((error) => {
    console.error("❌ Error saving payment to Firebase:", error)
    alert("Payment saved locally, but failed to save to Firebase. Check the console.")
  })

updatePaymentTable()
updateDashboard()
document.getElementById("paymentForm").reset()

// Show success message with payment status
const statusMessage = isFullyPaid
  ? `Payment recorded successfully! Rent is now FULLY PAID.`
  : `Payment recorded successfully! Remaining balance: KSh ${finalBalance.toLocaleString()}`

alert(statusMessage)


  // Auto-generate receipt for this payment
  setTimeout(() => {
    if (confirm("Would you like to generate a receipt for this payment?")) {
      generateReceipt(roomNumber, month, year)
    }
  }, 500)
})

// Update payment table to show better status indicators
function updatePaymentTable() {
  const tableBody = document.querySelector("#paymentTable tbody")
  tableBody.innerHTML = ""

  payments
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((payment) => {
      const row = document.createElement("tr")

      // Determine status
      let statusClass = "status-paid"
      let statusText = "PAID"

      if (payment.balance > 0) {
        statusClass = "status-partial"
        statusText = "PARTIAL"
      }

      row.innerHTML = `
            <td>${new Date(payment.date).toLocaleDateString()}</td>
            <td>${payment.roomNumber}</td>
            <td>${payment.tenantName}</td>
            <td>${payment.month} ${payment.year}</td>
            <td>KSh ${payment.amountPaid.toLocaleString()}</td>
            <td>${payment.paymentMethod}</td>
            <td>
                <span class="status-indicator ${statusClass}">${statusText}</span>
                ${payment.balance > 0 ? `<br><small>Balance: KSh ${payment.balance.toLocaleString()}</small>` : ""}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-success" onclick="generateReceipt('${payment.roomNumber}', '${payment.month}', '${payment.year}')" title="Generate Receipt">
                        Receipt
                    </button>
                </div>
            </td>
        `
      tableBody.appendChild(row)
    })
}

// Dashboard Updates
function updateDashboard() {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Calculate monthly income
  const monthlyPayments = payments.filter(
    (payment) => payment.month === monthNames[currentMonth] && Number.parseInt(payment.year) === currentYear,
  )
  const monthlyIncome = monthlyPayments.reduce((sum, payment) => sum + payment.amountPaid, 0)

  // Calculate yearly income
  const yearlyPayments = payments.filter((payment) => Number.parseInt(payment.year) === currentYear)
  const yearlyIncome = yearlyPayments.reduce((sum, payment) => sum + payment.amountPaid, 0)

  // Update occupied/vacant rooms
  const occupiedRooms = tenants.length
  const totalRooms = ROOMS.bedsitters.length + ROOMS.oneBedroom.length
  const vacantRooms = totalRooms - occupiedRooms

  document.getElementById("monthlyIncome").textContent = `KSh ${monthlyIncome.toLocaleString()}`
  document.getElementById("yearlyIncome").textContent = `KSh ${yearlyIncome.toLocaleString()}`
  document.getElementById("occupiedRooms").textContent = `${occupiedRooms}/${totalRooms}`
  document.getElementById("vacantRooms").textContent = `${vacantRooms}/${totalRooms}`
}

// Update Room Status
function updateRoomStatus() {
  const bedsitterStatus = document.getElementById("bedsitterStatus")
  const oneBedroomStatus = document.getElementById("oneBedroomStatus")

  bedsitterStatus.innerHTML = ""
  oneBedroomStatus.innerHTML = ""

  const occupiedRooms = tenants.map((tenant) => tenant.roomNumber)

  // Update bedsitter status
  ROOMS.bedsitters.forEach((room) => {
    const roomDiv = document.createElement("div")
    roomDiv.className = `room-item ${occupiedRooms.includes(room) ? "occupied" : "vacant"}`
    roomDiv.textContent = room
    bedsitterStatus.appendChild(roomDiv)
  })

  // Update one bedroom status
  ROOMS.oneBedroom.forEach((room) => {
    const roomDiv = document.createElement("div")
    roomDiv.className = `room-item ${occupiedRooms.includes(room) ? "occupied" : "vacant"}`
    roomDiv.textContent = room
    oneBedroomStatus.appendChild(roomDiv)
  })
}

// Receipt Generation
// Enhanced receipt generation with proper balance handling
function generateReceipt(roomNumber, month, year) {
  const tenant = tenants.find((t) => t.roomNumber === roomNumber)
  const payment = payments.find((p) => p.roomNumber === roomNumber && p.month === month && p.year === year)

  if (!tenant) {
    alert("No tenant found for this room!")
    return
  }

  if (!payment) {
    alert("No payment record found for this month!")
    return
  }

  const roomType = ROOMS.bedsitters.includes(roomNumber) ? "bedsitters" : "oneBedroom"
  const rentAmount = RENT_PRICES[roomType]
  const roomTypeDisplay = roomType === "bedsitters" ? "Bedsitter" : "One-Bedroom"
  const isFullyPaid = payment.balance <= 0

  // Calculate if this was a partial payment that cleared the balance
  const wasPartiallyPaid = payment.previousBalance && payment.previousBalance < rentAmount
  const clearedBalance = wasPartiallyPaid && isFullyPaid

  const receiptContent = `
        <div class="receipt-header">
            <h2>ST. LOUIS APARTMENTS</h2>
            <p>RENT PAYMENT RECEIPT</p>
        </div>
        
        <div class="receipt-section">
            <h3>Receipt Details</h3>
            <div class="receipt-row">
                <span><strong>Receipt No:</strong></span>
                <span>${payment.id}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Date:</strong></span>
                <span>${new Date(payment.date).toLocaleDateString()}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Payment Method:</strong></span>
                <span>${payment.paymentMethod}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Month Covered:</strong></span>
                <span>${month} ${year}</span>
            </div>
        </div>

        <div class="receipt-section">
            <h3>Property Details</h3>
            <div class="receipt-row">
                <span><strong>Property:</strong></span>
                <span>ST. Louis Apartments</span>
            </div>
            <div class="receipt-row">
                <span><strong>Room Number:</strong></span>
                <span>${roomNumber}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Room Type:</strong></span>
                <span>${roomTypeDisplay}</span>
            </div>
        </div>

        <div class="receipt-section">
            <h3>Tenant Information</h3>
            <div class="receipt-row">
                <span><strong>Full Name:</strong></span>
                <span>${tenant.fullName}</span>
            </div>
            <div class="receipt-row">
                <span><strong>ID Number:</strong></span>
                <span>${tenant.idNumber}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Phone:</strong></span>
                <span>${tenant.phoneNumber}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Email:</strong></span>
                <span>${tenant.email || "N/A"}</span>
            </div>
        </div>

        <div class="payment-highlight">
            <h3>Payment Information</h3>
            <div class="receipt-row">
                <span><strong>Monthly Rent:</strong></span>
                <span>KES ${rentAmount.toLocaleString()}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Month Covered:</strong></span>
                <span>${month} ${year}</span>
            </div>
            
            ${
              wasPartiallyPaid
                ? `
            <div class="receipt-row">
                <span><strong>Previous Balance:</strong></span>
                <span>KES ${payment.previousBalance.toLocaleString()}</span>
            </div>
            <div class="receipt-row">
                <span><strong>This Payment:</strong></span>
                <span>KES ${payment.currentPayment ? payment.currentPayment.toLocaleString() : payment.amountPaid.toLocaleString()}</span>
            </div>
            `
                : ""
            }
            
            <div class="amount-paid">Total Amount Paid: KES ${payment.amountPaid.toLocaleString()}</div>
            
            <div class="balance-info">
                <strong>Current Balance: KES ${payment.balance > 0 ? payment.balance.toLocaleString() : "0"}</strong>
            </div>
            
            ${
              clearedBalance
                ? `
            <div style="color: #10b981; font-weight: bold; margin-top: 10px; text-align: center;">
                ✓ BALANCE CLEARED WITH THIS PAYMENT
            </div>
            `
                : ""
            }
        </div>

        <div class="payment-status ${isFullyPaid ? "" : "partial"}">
            ${isFullyPaid ? "FULLY PAID" : "PARTIAL PAYMENT"}
        </div>
    `

  document.getElementById("receiptContent").innerHTML = receiptContent
  document.getElementById("receiptPreview").style.display = "block"

  // Generate PDF with enhanced information
  downloadReceiptPDF(payment, tenant, roomNumber, month, year, roomTypeDisplay, rentAmount, clearedBalance)
}

document.getElementById("receiptForm").addEventListener("submit", (e) => {
  e.preventDefault()

  const roomNumber = document.getElementById("receiptRoom").value
  const month = document.getElementById("receiptMonth").value
  const year = document.getElementById("receiptYear").value

  generateReceipt(roomNumber, month, year)
})

// Enhanced PDF generation with balance clearing information
function downloadReceiptPDF(payment, tenant, roomNumber, month, year, roomTypeDisplay, rentAmount, clearedBalance) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.setFont(undefined, "bold")
  doc.text("ST. LOUIS APARTMENTS", 105, 20, { align: "center" })

  doc.setFontSize(12)
  doc.setFont(undefined, "normal")
  doc.text("RENT PAYMENT RECEIPT", 105, 30, { align: "center" })

  // Add horizontal line
  doc.line(20, 35, 190, 35)

  let yPos = 50

  // Receipt Details Section
  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.text("Receipt Details", 20, yPos)
  yPos += 5
  doc.line(20, yPos, 190, yPos)
  yPos += 10

  doc.setFont(undefined, "normal")
  doc.text(`Receipt No: ${payment.id}`, 20, yPos)
  yPos += 8
  doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, 20, yPos)
  yPos += 8
  doc.text(`Payment Method: ${payment.paymentMethod}`, 20, yPos)
  yPos += 8
  doc.text(`Month Covered: ${month} ${year}`, 20, yPos)
  yPos += 15

  // Property Details Section
  doc.setFont(undefined, "bold")
  doc.text("Property Details", 20, yPos)
  yPos += 5
  doc.line(20, yPos, 190, yPos)
  yPos += 10

  doc.setFont(undefined, "normal")
  doc.text("Property: ST. Louis Apartments", 20, yPos)
  yPos += 8
  doc.text(`Room Number: ${roomNumber}`, 20, yPos)
  yPos += 8
  doc.text(`Room Type: ${roomTypeDisplay}`, 20, yPos)
  yPos += 15

  // Tenant Information Section
  doc.setFont(undefined, "bold")
  doc.text("Tenant Information", 20, yPos)
  yPos += 5
  doc.line(20, yPos, 190, yPos)
  yPos += 10

  doc.setFont(undefined, "normal")
  doc.text(`Full Name: ${tenant.fullName}`, 20, yPos)
  yPos += 8
  doc.text(`ID Number: ${tenant.idNumber}`, 20, yPos)
  yPos += 8
  doc.text(`Phone: ${tenant.phoneNumber}`, 20, yPos)
  yPos += 8
  doc.text(`Email: ${tenant.email || "N/A"}`, 20, yPos)
  yPos += 15

  // Payment Information Section (Highlighted)
  const boxHeight = clearedBalance ? 45 : 35
  doc.setFillColor(240, 249, 255)
  doc.rect(15, yPos - 5, 180, boxHeight, "F")

  doc.setFont(undefined, "bold")
  doc.text("Payment Information", 20, yPos)
  yPos += 10

  doc.setFont(undefined, "normal")
  doc.text(`Monthly Rent: KES ${rentAmount.toLocaleString()}`, 20, yPos)
  yPos += 8
  doc.text(`Month Covered: ${month} ${year}`, 20, yPos)
  yPos += 8

  // Show payment breakdown if it was a partial payment
  if (payment.previousBalance && payment.previousBalance < rentAmount) {
    doc.text(`Previous Balance: KES ${payment.previousBalance.toLocaleString()}`, 20, yPos)
    yPos += 6
    doc.text(
      `This Payment: KES ${payment.currentPayment ? payment.currentPayment.toLocaleString() : payment.amountPaid.toLocaleString()}`,
      20,
      yPos,
    )
    yPos += 8
  }

  // Amount Paid (Green and Bold)
  doc.setTextColor(16, 185, 129)
  doc.setFont(undefined, "bold")
  doc.setFontSize(14)
  doc.text(`Total Amount Paid: KES ${payment.amountPaid.toLocaleString()}`, 105, yPos, { align: "center" })
  yPos += 8

  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, "normal")
  doc.setFontSize(12)
  doc.text(`Current Balance: KES ${payment.balance > 0 ? payment.balance.toLocaleString() : "0"}`, 20, yPos)
  yPos += 8

  // Balance cleared notification
  if (clearedBalance) {
    doc.setTextColor(16, 185, 129)
    doc.setFont(undefined, "bold")
    doc.text("✓ BALANCE CLEARED WITH THIS PAYMENT", 105, yPos, { align: "center" })
    yPos += 8
  }

  yPos += 10

  // Payment Status
  const isFullyPaid = payment.balance <= 0
  const statusText = isFullyPaid ? "FULLY PAID" : "PARTIAL PAYMENT"
  const statusColor = isFullyPaid ? [16, 185, 129] : [245, 158, 11]

  doc.setDrawColor(...statusColor)
  doc.setTextColor(...statusColor)
  doc.setLineWidth(1)
  doc.rect(50, yPos, 110, 15)

  doc.setFont(undefined, "bold")
  doc.setFontSize(14)
  doc.text(statusText, 105, yPos + 10, { align: "center" })


  // Save PDF
  doc.save(`Receipt_${roomNumber}_${month}_${year}.pdf`)
}
function editIncome(type) {
  const label = type === 'monthly' ? "Monthly Income" : "Yearly Income";
  const input = prompt(`Enter new value for ${label} (in KSh):`);

  if (input === null) return; // User cancelled

  const newValue = parseFloat(input.replace(/,/g, ''));
  if (isNaN(newValue) || newValue < 0) {
    alert("❌ Invalid amount. Please enter a valid number.");
    return;
  }

  db.collection("statistics").doc("incomeTotals").set({
    [type + "Income"]: newValue,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true })
  .then(() => {
    alert(`✅ ${label} updated to KSh ${newValue.toLocaleString()}`);
    document.getElementById(type + "Income").textContent = `KSh ${newValue.toLocaleString()}`;
  })
  .catch((error) => {
    console.error(`❌ Error updating ${label}:`, error);
    alert("Failed to update. Check console for details.");
  });
}


// Initialize room status on page load
updateRoomStatus()

