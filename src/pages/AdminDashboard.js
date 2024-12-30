import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/components/AdminDashboard.css";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend,ArcElement,PointElement,LineElement, // Import LineElement
} from "chart.js";

// Register chart elements
ChartJS.register(
  CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend,ArcElement,PointElement,LineElement // Register LineElement for the Line chart
);
import jsPDF from "jspdf";
import "jspdf-autotable";

const AdminDashboard = () => {
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dealerSearch, setDealerSearch] = useState("");
  const [installerSearch, setInstallerSearch] = useState("");
  const [dealerPage, setDealerPage] = useState(1);
  const [installerPage, setInstallerPage] = useState(1);
  const [activityType, setActivityType] = useState("Dealer");
  const [showLogs, setShowLogs] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [updatedDetails, setUpdatedDetails] = useState({ name: "", phoneNumber: "", address: "", companyName: "" });
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [UserStatuses, setUserStatuses] = useState();
  const [currentPage, setCurrentPage] = useState(1);

  const downloadLogsAsPDF = () => {
    const doc = new jsPDF();
  
    // Add title to the PDF
    doc.text("Activity Logs", 14, 10);
  
    // Prepare data for the table
    const tableData = filteredActivityLogs.map((log) => [
      log.action,
      log.email,
      log.role,
      new Date(log.timestamp.seconds * 1000).toLocaleString(),
    ]);
  
    // Add the table
    doc.autoTable({
      head: [["Action", "Email", "Role", "Timestamp"]],
      body: tableData,
      startY: 20, // Start below the title
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 123, 255] }, // Blue header
    });
  
    // Save the PDF
    doc.save("activity_logs.pdf");
  };
  
  const itemsPerPage = 3;

  const logPages = 5
  
  const handleManageDealer = () => {
    navigate('/manage'); // Redirect to the UserManagement page
  };
  
  const handleManageInstaller = () => {
    navigate('/manage1'); // Redirect to the UserManagement page
  };
  const navigate = useNavigate();

  const handleProfileClick = (user) => {
    setSelectedProfile(user); // Set the profile of the clicked user
    setUpdatedDetails({ // Set the current details for editing
      name: user.name,
      phoneNumber: user.phoneNumber,
      address: user.address,
      companyName: user.companyName,
    });
    setIsModalOpen(true); // Open the modal for editing
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const userRef = doc(db, "users", selectedProfile.uid);
      await updateDoc(userRef, {
        name: updatedDetails.name||null,
        phoneNumber: updatedDetails.phoneNumber || null,
        address: updatedDetails.address|| null,
        companyName: updatedDetails.companyName|| null,
      });
      // Update the user in the local state as well
      setDealers((prevDealers) =>
        prevDealers.map((dealer) =>
          dealer.id === selectedProfile.id ? { ...dealer, ...updatedDetails } : dealer
        )
      );
      setInstallers((prevInstallers) =>
        prevInstallers.map((installer) =>
          installer.id === selectedProfile.id ? { ...installer, ...updatedDetails } : installer
        )
      );
      setIsModalOpen(false); // Close the modal after saving changes
    } catch (err) {
      console.error("Error updating user profile:", err);
      alert(err)
    }
  };


  const handleViewLogs = () => {
    setSelectedLogs(activityLogs);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleShowLogs = () => {
    setShowLogs(!showLogs); // Toggle the visibility of logs
  };

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
    } else {
      const fetchAdminData = async () => {
        try {
          // Fetch Quotations from Quotation_form
          const quotationsSnapshot = await getDocs(collection(db, "Quotation_form"));
          const quotationsData = quotationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setQuotations(quotationsData);

          // Fetch Orders
          const ordersSnapshot = await getDocs(collection(db, "orders"));
          setOrders(
            ordersSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );

          // Fetch Dealers from "users" Collection
          const dealersSnapshot = await getDocs(collection(db, "users"));
          setDealers(
            dealersSnapshot.docs
              .filter((doc) => doc.data().role === "Dealer")
              .map((doc) => ({ id: doc.id, ...doc.data() }))
          );

          // Fetch Installers from "users" Collection
          const installersSnapshot = await getDocs(collection(db, "users"));
          setInstallers(
            installersSnapshot.docs
              .filter((doc) => doc.data().role === "Installer")
              .map((doc) => ({ id: doc.id, ...doc.data() }))
          );

          // Generate Reports for Orders
          const reportData = {
            totalOrders: ordersSnapshot.docs.length,
            completedOrders: ordersSnapshot.docs.filter(
              (doc) => doc.data().status === "Completed"
            ).length,
            pendingOrders: ordersSnapshot.docs.filter(
              (doc) => doc.data().status === "Pending"
            ).length,
            approvedOrders: ordersSnapshot.docs.filter(
              (doc) => doc.data().status === "Approved"
            ).length,
          };
          setReports(reportData);

          // Fetch Activity Logs for Dealers and Installers
          const activityLogsSnapshot = await getDocs(collection(db, "activity_logs"));
          const activityLogsData = activityLogsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setActivityLogs(activityLogsData);
        } catch (err) {
          console.error("Error fetching admin data:", err);
          setError("An error occurred while fetching data. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      fetchAdminData();
    }
  }, [navigate]);

  const handleApproveInstaller = async (installerId) => {
    try {
      await updateDoc(doc(db, "users", installerId), { status: "Approved" });
      setInstallers((prev) =>
        prev.map((installer) =>
          installer.id === installerId ? { ...installer, status: "Approved" } : installer
        )
      );
    } catch (err) {
      console.error("Error approving installer:", err);
    }
  };

 // Filtering Logic
 const filteredDealers = dealers.filter(
  (dealer) =>
    dealer.name.toLowerCase().includes(dealerSearch.toLowerCase()) ||
    dealer.email.toLowerCase().includes(dealerSearch.toLowerCase())
);
const filteredInstallers = installers.filter(
  (installer) =>
    installer.name.toLowerCase().includes(installerSearch.toLowerCase()) ||
    installer.email.toLowerCase().includes(installerSearch.toLowerCase())
);

useEffect(() => {
  const fetchDealers = async () => {
    const dealersSnapshot = await getDocs(collection(db, "users"));
    const dealerData = dealersSnapshot.docs
      .filter((doc) => doc.data().role === "Dealer")
      .map((doc) => ({ id: doc.id, ...doc.data() }));
    setDealers(dealerData);
    console.log(dealerData); // Log to confirm data is populated
  };

  fetchDealers();
}, []);



// Filter Activity Logs based on selection
const filteredActivityLogs =
  activityType === "Dealer"
    ? activityLogs.filter((log) =>
        filteredDealers.some((dealer) => dealer.id === log.userId)
      )
    : activityLogs.filter((log) =>
        filteredInstallers.some((installer) => installer.id === log.userId)
      );

// Handle Activity Type Change (Dealer / Installer)
const handleActivityTypeChange = (e) => {
  setActivityType(e.target.value);
  setDealerSearch("");
  setInstallerSearch("");
};

const logsPerPage = logPages; // Number of logs per page
const startIndex = (currentPage - 1) * logsPerPage;
const endIndex = startIndex + logsPerPage;

const activityLogsToDisplay = filteredActivityLogs.slice(startIndex, endIndex);


const handleLogsPageChange = (newPage) => {
  setCurrentPage(newPage);
};



  // Pagination Logic
  const paginatedDealers = filteredDealers.slice(
    (dealerPage - 1) * itemsPerPage,
    dealerPage * itemsPerPage
  );
  const paginatedInstallers = filteredInstallers.slice(
    (installerPage - 1) * itemsPerPage,
    installerPage * itemsPerPage
  );

  const handlePageChange = (setter, page) => {
    setter(page);
  };


  const downloadLogsAsCSV = () => {
    const headers = ["Action", "Email", "Role", "Timestamp"];
    const rows = filteredActivityLogs.map((log) => [
      log.action,
      log.email,
      log.role,
      new Date(log.timestamp.seconds * 1000).toLocaleString(),
    ]);
  
    // Combine headers and rows into CSV string
    const csvContent =
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  
    // Create a Blob and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "activity_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  

  // Calculate quotation stats
  const calculateQuotationStats = () => {
    const totalQuotations = quotations.length;
    const approvedQuotations = quotations.filter((quotation) => quotation.status === "Approved").length;
    const pendingQuotations = quotations.filter((quotation) => quotation.product?.status === "Pending").length;
    const totalEstimatedAmount = quotations.reduce((total, quotation) => total + (parseFloat(quotation.estimatePrice || 0)), 0);
    const rejectedQuotations = quotations.filter((quotations) => quotations.status === "Rejected").length;

    return {
      totalQuotations,
      approvedQuotations,
      pendingQuotations,
      totalEstimatedAmount,
      rejectedQuotations,
    };
  };

  const { totalQuotations, approvedQuotations, pendingQuotations, totalEstimatedAmount, rejectedQuotations } = calculateQuotationStats();

  // Filter Activity Logs for Dealer and Installer
  const dealerActivityLogs = activityLogs.filter((log) => 
    filteredDealers.some((dealer) => dealer.id === log.userId)
  );
  const installerActivityLogs = activityLogs.filter((log) => 
    filteredInstallers.some((installer) => installer.id === log.userId)
  );

  const prepareActivityData = () => {
    const labels = [];
    const counts = [];
    const userLabels = [];
  
    filteredActivityLogs.forEach((log) => {
      const date = new Date(log.timestamp.seconds * 1000).toLocaleDateString();
      const user = activityType === "Dealer" 
        ? dealers.find((dealer) => dealer.id === log.userId)?.name 
        : installers.find((installer) => installer.id === log.userId)?.name;
  
      const label = `${date} (${user || "Unknown User"})`;
  
      if (!labels.includes(label)) {
        labels.push(label);
        counts.push(1);
        userLabels.push(user || "Unknown User");
      } else {
        const index = labels.indexOf(label);
        counts[index] += 1;
      }
    });
  
    return {
      labels, // These will include date and user names
      datasets: [
        {
          label: `${activityType} Activity`,
          data: counts,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };
  

  const chartData = prepareActivityData();

  const prepareQuotationPieChartData = () => {
    return {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [
        {
          data: [approvedQuotations, pendingQuotations, rejectedQuotations,],
          backgroundColor: [
            "rgba(0, 128, 0, 0.6)",  // Green for Approved
            "rgba(255, 165, 0, 0.6)",  // Orange for Pending
            "rgba(255, 0, 0, 0.6)",  // Red for Rejected
    
          ],
          borderColor: [
            "rgba(0, 128, 0, 1)",  // Dark Green for Approved
            "rgba(255, 165, 0, 1)",  // Dark Orange for Pending
            "rgba(255, 0, 0, 1)",  // Dark Red for Rejected
          ],
          borderWidth: 1,
        },
      ],
    };
  };


  useEffect(() => {
    const fetchUserStatuses = async () => {
      const dealersSnapshot = await getDocs(collection(db, "users"));
      const statuses = {
        Active: 0,
        Inactive: 0,
        Blocked: 0,
      };
  
      dealersSnapshot.docs.forEach((doc) => {
        const status = doc.data().status?.toLowerCase();
        if (status === "active") statuses.Active += 1;
        if (status === "inactive") statuses.Inactive += 1;
        if (status === "blocked") statuses.Blocked += 1;
        
      });
  
      setUserStatuses(statuses);
    };
  
    fetchUserStatuses();
  }, []);
  
  const prepareStatusPieChartData = () => ({
    labels: ["Active", "Inactive", "Blocked"],
    datasets: [
      {
        data: [
          UserStatuses?.Active || 0,
          UserStatuses?.Inactive || 0,
          UserStatuses?.Blocked || 0,
        ],
        backgroundColor: [
          "rgba(0, 128, 0, 0.6)",  // Green for Active
          "rgba(255, 165, 0, 0.6)", // Orange for Inactive
          "rgba(255, 0, 0, 0.6)",   // Red for Blocked
        ],
        borderColor: [
          "rgba(0, 128, 0, 1)",
          "rgba(255, 165, 0, 1)",
          "rgba(255, 0, 0, 1)",
        ],
        borderWidth: 1,
      },
    ],
  });
  

  const prepareEstimatedPriceData = () => {
    const labels = quotations.map((quotation) =>
      new Date(quotation.timestamp).toLocaleDateString()
    );
    const data = quotations.map((quotation) =>
      parseFloat(quotation.estimatePrice || 0)
    );
  
    return {
      labels,
      datasets: [
        {
          label: "Estimated Price",
          data,
          borderColor: "#3498db", // Blue line
          backgroundColor: "rgba(52, 152, 219, 0.2)", // Light blue fill
          borderWidth: 2,
          tension: 0.4, // Smooth curve
          pointBackgroundColor: "#2980b9",
        },
      ],
    };
  };
  
  const HandleManageQuotations = () => {
    navigate('/Quotation-management')
  }
  
  

  return (
    <div className="dashboard-container">
   
        <h1>Admin Dashboard</h1>
    

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div>
            {/* Quotation and Order Management */}
        <div className="dashboard-section">
        <div className="admin-dashboard-header">
          <h3>Quotations and Orders</h3>
          <button onClick={HandleManageQuotations} className="admin-dashboard-button">Manage Quotations</button>
          </div>
          <div className="dashboard-section01" >
          <div className="piChart-container">
            <h4>Quotation Status Overview</h4>
          <Pie
          data={prepareQuotationPieChartData()}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function (tooltipItem) {
                    const value = tooltipItem.raw;
                    return `${tooltipItem.label}: ${value} (${((value / totalQuotations) * 100).toFixed(2)}%)`;
                  },
                },
              },
            },
          }}
        />
        </div>

        <div className="chart-container">
        <h4>Estimated Price Over Time</h4>
        <Line
          data={prepareEstimatedPriceData()}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: "top",
              },
              tooltip: {
                callbacks: {
                  label: function (tooltipItem) {
                    return `₹${tooltipItem.raw.toFixed(2)}`;
                  },
                },
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Date",
                  color: "#34495e",
                },
                grid: {
                  display: false,
                },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Estimated Price (₹)",
                  color: "#34495e",
                },
                ticks: {
                  callback: function (value) {
                    return `₹${value}`;
                  },
                },
              },
            },
          }}
        />
      </div>
          </div>
          <div>
          <p><strong>Total Quotations:</strong> {totalQuotations}</p>
          <p><strong>Approved:</strong> {approvedQuotations}</p>
          <p><strong>Pending:</strong> {pendingQuotations}</p>
          <p><strong>Rejected:</strong> {rejectedQuotations}</p>
          <p><strong>Total Estimated Amount:</strong> ₹{totalEstimatedAmount.toFixed(2)}</p>
          </div>
        </div>


           {/* Activity Logs Section - Moved below Quotations */}
        <div className="dashboard-section">
          <div className="admin-dashboard-header">
          <h3>Activity</h3>

          {/* Search Input */}
          <input
            type="text"
            placeholder={`Search ${activityType}s...`}
            value={activityType === "Dealer" ? dealerSearch : installerSearch}
            onChange={(e) => 
              activityType === "Dealer" 
                ? setDealerSearch(e.target.value)
                : setInstallerSearch(e.target.value)
            }
          />

<select value={activityType} onChange={handleActivityTypeChange}>
            <option value="Dealer">Dealer</option>
            <option value="Installer">Installer</option>
          </select>
          </div>

          <div className="graph-container-activity">
          {/* Graph Display */}
          <div className="chart-container">
            <h4>Activity Graph</h4>
          <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      autoSkip: false, // Ensures labels don't skip (optional)
                    },
                  },
                  y: {
                    beginAtZero: true, // Ensures y-axis starts at zero
                  },
                },
                barThickness: 50, // Adjust the thickness of the bars (set to desired pixel value)
                maxBarThickness: 100, // (Optional) Limit the maximum thickness
              }}
            />
          </div>

          <div className="piChart-container">
          
        <Pie
        data={prepareStatusPieChartData()}
        options={{
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
        }}
      />

      <h4>Account Status Graph</h4>
      </div>
      </div>
          

          {/* View Logs Link */}
          <div className="view-logs-link">
              <button onClick={handleShowLogs}>
                {showLogs ? "Hide Logs" : "View Logs"}
              </button>
            </div>

{/* Modal for Viewing Activity Logs */}
{/* Modal for Viewing Activity Logs */}
{showLogs && activityLogsToDisplay.length > 0 ? (
  <div className="Activity-log-modal-overlay">
    <div className="Activity-log-modal-content">
      <div className="Activity-log-header">
      <h2>Activity Logs</h2>

      
      {/* Close Button */}
      <button className="Activity-log-close-button" onClick={handleShowLogs}>
        ×
      </button>
      </div>
      <table className="Activity-logs-table">
        
        <thead>
          <tr>
            <th>Action</th>
            <th>Email</th>
            <th>Role</th>
            <th>Timestamp</th>
            <th><button className="Activity-log-download-button" onClick={downloadLogsAsPDF}>
          Download Logs
        </button></th>
          </tr>
        </thead>
        <tbody>
          {/* Displaying each log in a row */}
          {activityLogsToDisplay.map((log) => (
            <tr key={log.id}>
              <td>{log.action}</td>
              <td>{log.email}</td>
              <td>{log.role}</td>
              <td>{new Date(log.timestamp.seconds * 1000).toLocaleString()}</td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="Activity-logs-pagination">
  <button
    onClick={() => handleLogsPageChange(currentPage - 1)}
    disabled={currentPage === 1}
    className="Activity-logs-pagination-button"
  >
    Previous
  </button>

  {Array.from(
    { length: Math.ceil(filteredActivityLogs.length / logsPerPage) },
    (_, i) => (
      <button
        key={i}
        onClick={() => handleLogsPageChange(i + 1)}
        className={`Activity-logs-pagination-button ${currentPage === i + 1 ? "active" : ""}`}
      >
        {i + 1}
      </button>
    )
  )}

  <button
    onClick={() => handleLogsPageChange(currentPage + 1)}
    disabled={currentPage === Math.ceil(filteredActivityLogs.length / logsPerPage)}
    className="Activity-logs-pagination-button"
  >
    Next
  </button>

  
</div>
</div>
  </div>
) : showLogs ? (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Activity Logs</h3>
      <button className="close-button" onClick={handleShowLogs}>
        ×
      </button>
      <p>No activity logs found for {activityType}s.</p>
    </div>
  </div>
) : null}



        </div>

          {/* Dealer Management */}
          <div className="dashboard-section">
            <div className="admin-dashboard-header">
            <h3>Dealer Management</h3>
            <input
              type="text"
              placeholder="Search dealers..."
              value={dealerSearch}
              onChange={(e) => {
                console.log(e.target.value); // Log search input
                setDealerSearch(e.target.value);
              }}
            />
            <button onClick={handleManageDealer} className="admin-dashboard-button">Manage Dealer</button>
            </div>
            {paginatedDealers.map((dealer) => (
              <div key={dealer.id} className="user-card" onClick={() => handleProfileClick(dealer)}>
                <p><strong>Dealer Name:</strong> {dealer.name}</p>
                <p><strong>Email:</strong> {dealer.email}</p>
                <p><strong>Referral ID:</strong> {dealer.referralId}</p>
                <p><strong>Account Status:</strong>{dealer.status}</p>
              </div>
            ))}
            {/* Pagination for Dealers */}
            <div className="admin-pagination">
              <button
                onClick={() => handlePageChange(setDealerPage, dealerPage - 1)}
                disabled={dealerPage === 1}
                className="admin-pagination-button"
              >
                Previous
              </button>
              {Array.from(
                { length: Math.ceil(filteredDealers.length / itemsPerPage) },
                (_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(setDealerPage, i + 1)}
                    className={`pagination-button ${dealerPage === i + 1 ? "active" : ""}`}
                  >
                    {i + 1}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(setDealerPage, dealerPage + 1)}
                disabled={dealerPage === Math.ceil(filteredDealers.length / itemsPerPage)}
                className="admin-pagination-button"
              >
                Next
              </button>
            </div>

          </div>

          {/* Installer Management */}
          <div className="dashboard-section">
            <div className="admin-dashboard-header">
            <h3>Installer Management</h3>
            <input
              type="text"
              placeholder="Search installers..."
              value={installerSearch}
              onChange={(e) => setInstallerSearch(e.target.value)}
            />
            <button onClick={handleManageInstaller} className="admin-dashboard-button">Manage Installer</button>
            </div>
            {paginatedInstallers.map((installer) => (
              <div key={installer.id} className="user-card" onClick={() => handleProfileClick(installer)}>
                <p><strong>Installer Name:</strong> {installer.name}</p>
                <p><strong>Email:</strong> {installer.email}</p>
                <p><strong>Referral ID:</strong> {installer.referralId}</p>
                <p><strong>Account Status:</strong>{installer.status}</p>
              </div>
            ))}
            {/* Pagination for Installers */}
            <div className="admin-pagination">
              <button
                onClick={() => handlePageChange(setInstallerPage, installerPage - 1)}
                disabled={installerPage === 1}
                className="admin-pagination-button"
              >
                Previous
              </button>
              {Array.from(
                { length: Math.ceil(filteredInstallers.length / itemsPerPage) },
                (_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(setInstallerPage, i + 1)}
                    className={`pagination-button ${installerPage === i + 1 ? "active" : ""}`}
                  >
                    {i + 1}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(setInstallerPage, installerPage + 1)}
                disabled={installerPage === Math.ceil(filteredInstallers.length / itemsPerPage)}
                className="admin-pagination-button"
              >
                Next
              </button>
            </div>
          </div>

           {/* Profile Modal */}
           {isModalOpen && selectedProfile && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Edit Profile</h3>
                <button className="close-button" onClick={handleCloseModal}>
                  ×
                </button>
                <div>
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={updatedDetails.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={updatedDetails.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={updatedDetails.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={updatedDetails.companyName}
                    onChange={handleInputChange}
                  />
                </div>
                <button onClick={handleSaveChanges}>Save Changes</button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
