import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/components/AdminDashboard.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend,ArcElement,PointElement,LineElement, // Import LineElement
} from "chart.js";
import { useLanguage } from "../context/LanguageContext";

// Register chart elements
ChartJS.register(
  CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend,ArcElement,PointElement,LineElement // Register LineElement for the Line chart
);


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
  const { language } = useLanguage(); 

  const translations = {
    en: {
      dashboardTitle: "Admin Dashboard",
      quotationsAndOrders: "Quotations and Orders",
      manageQuotations: "Manage Quotations",
      quotationStatusOverview: "Quotation Status Overview",
      estimatedPriceOverTime: "Estimated Price Over Time",
      totalQuotations: "Total Quotations",
      approved: "Approved",
      pending: "Pending",
      rejected: "Rejected",
      totalEstimatedAmount: "Total Estimated Amount",
      activity: "Activity",
      searchDealers: "Search dealers...",
      manageDealer: "Manage Dealer",
      dealerName: "Dealer Name",
      referralId: "Referral ID",
      accountStatus: "Account Status",
      installerName: "Installer's Name",
      searchInstallers: "Search installers...",
      manageInstaller: "Manage Installer",
      activityLogs: "Activity Logs",
      viewLogs: "View Logs",
      hideLogs: "Hide Logs",
      downloadLogs: "Download Logs",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      activityGraph: "Activity Graph",
      accountStatusGraph: "Account Status Graph",
      dealerManagement: "Dealer Management",
      installerManagement: "Installer Management",
      email: "Email",
      accountStatus: "Account Status",
      editProfile: "Edit Profile",
      name: "Name",
      phoneNumber: "Phone Number",
      address: "Address",
      companyName: "Company Name",
      saveChanges: "Save Changes",
      activityLogs: "Activity Logs",
      action: "Action",
      role: "Role",
      timestamp: "Timestamp",
      downloadLog: "Download Log",
    },
    fr: {
      dashboardTitle: "Tableau de bord administrateur",
      quotationsAndOrders: "Devis et commandes",
      manageQuotations: "Gérer les devis",
      quotationStatusOverview: "Vue d'ensemble des statuts des devis",
      estimatedPriceOverTime: "Prix estimé au fil du temps",
      totalQuotations: "Nombre total de devis",
      approved: "Approuvé",
      pending: "En attente",
      rejected: "Rejeté",
      totalEstimatedAmount: "Montant total estimé",
      activity: "Activité",
      searchDealers: "Rechercher des revendeurs...",
      manageDealer: "Gérer le revendeur",
      dealerName: "Nom du revendeur",
      referralId: "ID de parrainage",
      accountStatus: "Statut du compte",
      installerName: "Nom de l'installateur",
      searchInstallers: "Rechercher des installateurs...",
      manageInstaller: "Gérer l'installateur",
      activityLogs: "Journaux d'activité",
      viewLogs: "Voir les journaux",
      hideLogs: "Masquer les journaux",
      downloadLogs: "Télécharger les journaux",
      previous: "Précédent",
      next: "Suivant",
      page: "Page",
      of: "de",
      activityGraph: "Graphique d'activité",
      accountStatusGraph: "Graphique de l'état du compte",
      dealerManagement: "Gestion des revendeurs",
      installerManagement: "Gestion des installateurs",
      email: "Courriel",
      accountStatus: "Statut du compte",
      editProfile: "Modifier le profil",
      name: "Nom",
      phoneNumber: "Numéro de téléphone",
      address: "Adresse",
      companyName: "Nom de l'entreprise",
      saveChanges: "Enregistrer les modifications",
      activityLogs: "Journaux d'activité",
      action: "Action",
      role: "Rôle",
      timestamp: "Horodatage",
      downloadLog: "Télécharger le journal",
    },
  };
  

  const t = translations[language];

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
      labels: [t.approved, t.pending, t.rejected],
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
        <h1>{t.dashboardTitle}</h1>
    

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div>
            {/* Quotation and Order Management */}
        <div className="dashboard-section">
        <div className="admin-dashboard-header">
          <h3>{t.quotationsAndOrders}</h3>
          <button onClick={HandleManageQuotations} className="admin-dashboard-button">{t.manageQuotations}</button>
          </div>
          <div className="dashboard-section01" >
          <div className="piChart-container">
            <h4>{t.quotationStatusOverview}</h4>
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
        <h4>{t.estimatedPriceOverTime}</h4>
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
          <p><strong>{t.totalQuotations}:</strong> {totalQuotations}</p>
          <p><strong>{t.approved}:</strong> {approvedQuotations}</p>
          <p><strong>{t.pending}:</strong> {pendingQuotations}</p>
          <p><strong>{t.totalEstimatedAmount}:</strong> ₹{totalEstimatedAmount.toFixed(2)}</p>
          </div>
        </div>


           {/* Activity Logs Section - Moved below Quotations */}
        <div className="dashboard-section">
          <div className="admin-dashboard-header">
          <h3>{t.activity}</h3>

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
            <h4>{t.activityGraph}</h4>
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

      <h4>{t.accountStatusGraph}</h4>
      </div>
      </div>
          

          {/* View Logs Link */}
          <div className="view-logs-link">
              <button onClick={handleShowLogs}>
                {showLogs ? t.hideLogs : t.viewLogs}
              </button>
            </div>

{/* Modal for Viewing Activity Logs */}
{/* Modal for Viewing Activity Logs */}
{showLogs && activityLogsToDisplay.length > 0 ? (
  <div className="Activity-log-modal-overlay">
    <div className="Activity-log-modal-content">
      <div className="Activity-log-header">
      <h2>{t.activityLogs}</h2>

      
      {/* Close Button */}
      <button className="Activity-log-close-button" onClick={handleShowLogs}>
        ×
      </button>
      </div>
      <table className="Activity-logs-table">
        
        <thead>
          <tr>
            <th>{t.action}</th>
            <th>{t.email}</th>
            <th>{t.role}</th>
            <th>{t.timestamp}</th>
            <th><button className="Activity-log-download-button" onClick={downloadLogsAsPDF}>
          {t.downloadLogs}
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
    {t.previous}
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
    {t.next}
  </button>

  
</div>
</div>
  </div>
) : showLogs ? (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>{t.activityLogs}</h3>
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
            <h3>{t.dealerManagement}</h3>
            <input
              type="text"
              placeholder={t.searchDealers}
              value={dealerSearch}
              onChange={(e) => {
                console.log(e.target.value); // Log search input
                setDealerSearch(e.target.value);
              }}
            />
            <button onClick={handleManageDealer} className="admin-dashboard-button">{t.manageDealer}</button>
            </div>
            {paginatedDealers.map((dealer) => (
              <div key={dealer.id} className="user-card" onClick={() => handleProfileClick(dealer)}>
                <p><strong>{t.dealerName}:</strong> {dealer.name}</p>
                <p><strong>{t.email}:</strong> {dealer.email}</p>
                <p><strong>{t.referralId}:</strong> {dealer.referralId}</p>
                <p><strong>{t.accountStatus}:</strong>{dealer.status}</p>
              </div>
            ))}
            {/* Pagination for Dealers */}
            <div className="admin-pagination">
              <button
                onClick={() => handlePageChange(setDealerPage, dealerPage - 1)}
                disabled={dealerPage === 1}
                className="admin-pagination-button"
              >
                {t.previous}
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
                {t.next}
              </button>
            </div>

          </div>

          {/* Installer Management */}
          <div className="dashboard-section">
            <div className="admin-dashboard-header">
            <h3>{t.installerManagement}</h3>
            <input
              type="text"
              placeholder={t.searchInstallers}
              value={installerSearch}
              onChange={(e) => setInstallerSearch(e.target.value)}
            />
            <button onClick={handleManageInstaller} className="admin-dashboard-button">{t.manageInstaller}</button>
            </div>
            {paginatedInstallers.map((installer) => (
              <div key={installer.id} className="user-card" onClick={() => handleProfileClick(installer)}>
                <p><strong>{t.installerName}:</strong> {installer.name}</p>
                <p><strong>{t.email}:</strong> {installer.email}</p>
                <p><strong>{t.referralId}:</strong> {installer.referralId}</p>
                <p><strong>{t.accountStatus}:</strong>{installer.status}</p>
              </div>
            ))}
            {/* Pagination for Installers */}
            <div className="admin-pagination">
              <button
                onClick={() => handlePageChange(setInstallerPage, installerPage - 1)}
                disabled={installerPage === 1}
                className="admin-pagination-button"
              >
                {t.previous}
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
                {t.next}
              </button>
            </div>
          </div>

           {/* Profile Modal */}
           {isModalOpen && selectedProfile && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>{t.editProfile}</h3>
                <button className="close-button" onClick={handleCloseModal}>
                  ×
                </button>
                <div>
                  <label>{t.name}</label>
                  <input
                    type="text"
                    name="name"
                    value={updatedDetails.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>{t.phoneNumber}</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={updatedDetails.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>{t.address}</label>
                  <input
                    type="text"
                    name="address"
                    value={updatedDetails.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>{t.companyName}</label>
                  <input
                    type="text"
                    name="companyName"
                    value={updatedDetails.companyName}
                    onChange={handleInputChange}
                  />
                </div>
                <button onClick={handleSaveChanges}>{t.saveChanges}</button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
