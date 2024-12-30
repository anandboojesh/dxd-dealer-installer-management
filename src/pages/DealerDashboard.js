import React, { useState, useEffect, useRef } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import {
  getDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/components/DealerDashboard.css";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement, // Import LineElement
} from "chart.js";

// Register chart elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement // Register LineElement for the Line chart
);

const DealerDashboard = () => {
  const [dealerName, setDealerName] = useState("");
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [referralData, setReferralData] = useState({
    referralId: "",
    totalReferrals: '',
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(2); // Set orders per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCommission, setTotalCommission] = useState(0);
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
   const [referralHistory, setReferralHistory] = useState([]);
   const [referralId, setReferralId] = useState('');
   const [referralSearchTerm, setReferralSearchTerm] = useState("");
   const [filteredReferralHistory, setFilteredReferralHistory] = useState([]);


  useEffect(() => {
    if (orders.length > 0) {
      const total = orders.reduce((sum, order) => sum + (order.commissionValue || 0), 0);
      setTotalCommission(total);
    }
  }, [orders]);


  const handleReferralSearch = (e) => {
    const searchQuery = e.target.value.toLowerCase();
    setReferralSearchTerm(searchQuery);
    
    const filtered = referralHistory.filter((referral) => {
      const name = referral.name?.toLowerCase() || "";
      const email = referral.email?.toLowerCase() || "";
      return name.includes(searchQuery) || email.includes(searchQuery);
    });
  
    setFilteredReferralHistory(filtered);
  };

  useEffect(() => {
    setFilteredReferralHistory(referralHistory);
  }, [referralHistory]);
  

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
    } else {
      const fetchDealerData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const { name, referralId, totalEarnings, status } = userDoc.data();
            setDealerName(name);
            setEarnings(totalEarnings);
      
            if (status === "Inactive") {
              alert(`Your account haven't activated by admin yet. Please contact admin and try again later!.`);
              await signOut(auth);
              navigate("/login");
              return;
            } else if(status === "Blocked"){
              alert(`Yoy account has been ${status} by the admin, Please contact admin`);
              await signOut(auth);
              navigate("/login");
              return;
            }
      
            // Fetch referrals from users collection
            const referralsQuery = query(
              collection(db, "users"),
              where("referrerId", "==", referralId)
            );
            const referralsSnapshot = await getDocs(referralsQuery);
            const totalReferrals = referralsSnapshot.size; // Number of matching documents
      
            setReferralData({ referralId, totalReferrals });
      
            // Fetch orders
            const ordersQuery = query(
              collection(db, "Quotation_form"),
              where("userId", "==", auth.currentUser.uid)
            );
            const ordersSnapshot = await getDocs(ordersQuery);
            const ordersList = ordersSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setOrders(ordersList);
            setFilteredOrders(ordersList);
          } else {
            setError("No user data found.");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("An error occurred while fetching data.");
        } finally {
          setLoading(false);
        }
      };
      

      fetchDealerData();
    }
  }, [navigate]);
  
 useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setReferralId(userData.referralId || 'N/A');
      } else {
        console.error('No such document!');
      }
    } catch (error) {
      console.error('Error fetching referral ID:', error);
    }
    finally{
      setLoading(false)
    }
  };

  const fetchReferralHistory = async () => {
    setError("");
    try {
      const userId = auth.currentUser?.uid;
      // Fetch the current user document to get the 'referrals' array
      const userDoc = doc(db, "users", userId);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const referralIds = userData.referrals || []; // Get the referral IDs

        if (referralIds.length > 0) {
          // Query the 'users' collection to fetch details of all users who joined using this referral code
          const q = query(collection(db, "users"), where("uid", "in", referralIds));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const referralUsers = querySnapshot.docs.map((doc) => doc.data());
            setReferralHistory(referralUsers);
          } else {
            setReferralHistory([]);
          }
        } else {
          setReferralHistory([]);
        }
      } else {
        setError("User data not found.");
      }
    } catch (err) {
      console.error("Error fetching referral history:", err);
      setError(err);
    }
  };

  useEffect(() => {
    fetchReferralHistory();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    const searchQuery = e.target.value.toLowerCase();
    const filtered = orders.filter((order) => {
      const orderNumber = order.orderNumber?.toString().toLowerCase() || "";
      const productName = order.product?.productName?.toLowerCase() || "";
      return orderNumber.includes(searchQuery) || productName.includes(searchQuery);
    });
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to the first page
  };

  // Handle pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const OrderItem = ({ order }) => (
    <div className="order-item" onClick={() => navigate(`/order/${order.id}`)}>
      <p>
        <strong>Order ID:</strong> #{order.orderNumber || "N/A"}
      </p>
      <p>
        <strong>Product:</strong> {order.product?.productName || "N/A"}
      </p>
      <p>
        <strong>Status:</strong> {order.status || "Delivered to admin"}
      </p>
      <p>
        <strong>Estimated Price:</strong> ₹{order.estimatePrice || 0}.00
      </p>
      <p>
        <strong>Commission:</strong> ₹{order.commissionValue || 0}.00
      </p>
      <p>
        <strong>Commission Percentage(%):</strong> {order.commissionPercentage || 0}%
      </p>
      <p>
        <strong>Payment Status:</strong> {order.paymentStatus || 0}
      </p>
    </div>
  );

  // Prepare chart data
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const earningsOverTime = orders.map((order) => ({
    date: new Date(order.timestamp).toLocaleDateString(),
    earnings: order.commissionValue || 0,
  }));

  const earningsData = {
    labels: earningsOverTime.map((entry) => entry.date),
    datasets: [
      {
        label: "Earnings",
        data: earningsOverTime.map((entry) => entry.earnings),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const orderStatusData = {
    labels: ["Approved", "Pending", "Rejected"], // Updated labels
    datasets: [
      {
        label: "Orders by Status",
        data: [
          ordersByStatus["Approved"] || 0,
          ordersByStatus["Pending"] || 0,
          ordersByStatus["Rejected"] || 0,
        ],
        backgroundColor: ["#4CAF50", "#FF9800", "#F44336"], // Specific color for Pending
        borderWidth: 1,
      },
    ],
  };

  const handleManageOrders = () => {
    navigate('/manage-order'); // Redirect to the UserManagement page
  };

  // Cleanup the chart when the component unmounts or data changes
  useEffect(() => {
    if (lineChartRef.current) {
      const existingChart = ChartJS.getChart(lineChartRef.current);
      if (existingChart) {
        existingChart.destroy();
      }
    }
  }, [lineChartRef]);

  return (
    <div className="dealer-dashboard-container">
      <div className="dashboard-header1">
        <h1>Dealer Dashboard</h1>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div>
          <h2>Welcome, {dealerName}</h2>

          {/* My Orders Section */}
          <div className="dealer-dashboard-section">
            <div className="dealer-dashboard-header">
            <h3>My Orders</h3>
            <div className="search-filter">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={handleSearch}
                />

                <button className="dealer-dashboard-button" onClick= {handleManageOrders}>Manage orders</button>
              </div>
            </div>
            <div className="container1">

              {currentOrders.length > 0 ? (
                currentOrders.map((order) => <OrderItem key={order.id} order={order} />)
              ) : (
                <p>No orders found.</p>
              )}
            </div>
            {/* Pagination */}
            <div className="dealer-pagination">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="dealer-pagination-button"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="dealer-pagination-button"
              >
                Next
              </button>
            </div>
          </div>

          {/* Earnings Section */}
          <div className="dealer-dashboard-section">
            <div className="dealer-dashboard-header">
            <h3>Earnings</h3>
            </div>
            <div className="container1">
              <p>
                <strong>Total Earnings:</strong> ₹{totalCommission || 0}
              </p>
            </div>
          </div>

          

            
              {/* Referrals Section */}
                <div className="dealer-dashboard-section">
                  <div className="dealer-dashboard-header">
                  <strong className="ref-h3">Referrals</strong>
                  <div className="search-filter">
                    <input
                      type="text"
                      placeholder="Search referrals..."
                      value={referralSearchTerm}
                      onChange={handleReferralSearch}
                    />

                    <button className="dealer-dashboard-button">Add Referral</button>
                  </div>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                  <p>
                    <strong>Referral ID:</strong> {referralData.referralId || "N/A"}{""}
                  </p>{""}
                  <p><strong>  All</strong>({referralHistory.length})</p> 
                 </div>
              


              {filteredReferralHistory.length === 0 ? (
              <p>No users have joined using your referral code.</p>
            ) : (
              <ul className="referral-history-list">
                {referralHistory.map((user, index) => (
                  <li key={index} className="referral-history-item">
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                  </li>
                ))}
              </ul>
            )}
            </div>
         

          {/* Reports Section */}
          <div className="dealer-dashboard-section">
            <div className="dealer-dashboard-header">
            <h3>Reports</h3>
            </div>
            <div className="chart-container">
              <div>
                <h4>Earnings Over Time</h4>
                <Line data={earningsData} ref={lineChartRef} />
              </div>
              <div>
                <h4>Orders by Status</h4>
                <Pie data={orderStatusData} ref={pieChartRef} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerDashboard;
