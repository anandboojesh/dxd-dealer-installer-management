import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import "../styles/components/OrderDetails.css";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderDoc = await getDoc(doc(db, "Quotation_form", orderId));
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          console.log("Order data:", orderData); // Debug: Check structure of fetched data
          setOrder(orderData);
        } else {
          setError("Order not found.");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("An error occurred while fetching order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="order-details-container">
      <button onClick={() => navigate(-1)} className="back-button">
        Back
      </button>
      <header className="order-header">
        <h2>Order Details</h2>
        <p>
          Order ID: <strong>#{orderId}</strong>
        </p>
        <p>Date: {new Date(order?.timestamp || Date.now()).toLocaleDateString()}</p>
        <span className={`status ${order?.status?.toLowerCase() || "unknown"}`}>
          {order?.status || "Unknown Status"}
        </span>
      </header>

      <div className="order-details-grid">
        <section className="customer-info card">
          <h3>Customer</h3>
          <p><strong>Name:</strong> {order?.clientName || "N/A"}</p>
          <p><strong>Email:</strong> {order?.clientEmail || "N/A"}</p>
          <p><strong>Phone:</strong> {order?.clientPhone || "N/A"}</p>
          <p><strong>Address:</strong> {order?.clientAddress || "N/A"}</p>
          <p><strong>City:</strong> {order?.city || "N/A"}</p>
          <p><strong>Postal Code:</strong> {order?.postalCode || "N/A"}</p>
        </section>

        <section className="order-info card">
          <h3>Price Info</h3>
          <p><strong>Estimated Price:</strong>₹ {order?.estimatePrice || 0}.00</p>
          <p><strong>Commission Price:</strong>₹ {order?.commissionValue || 0}.00</p>
          <p><strong>Commission Percentage:</strong> {order?.commissionPercentage || 0}%</p>
        </section>

        <section className="payment-info card">
          <h3>Payment Info</h3>
          <p><strong>Payable Amount:</strong>₹ {order?.estimatePrice || 0}.00</p>
          <p><strong>Paid:</strong> {order?.paymentStatus === "Complete" ? "Yes" : "No"}</p>
          <p><strong>Status:</strong> {order?.paymentStatus || "N/A"}</p>
        </section>

        <section className="payment-info card">
          <h3>Installer Info</h3>
          <p><strong>Installer Status:</strong> {order?.Installer || "Not assigned yet."}</p>
          <p><strong>Installer Name:</strong> {order?.assignedInstallerName || "N/A"}</p>
          <p><strong>Installer ID:</strong> {order?.assignedTo || "N/A"}</p>
          <p><strong>Installer Acknowledgement:</strong> {order?.installerAcknowledgement || "N/A"}</p>
        </section>
      </div>

      <section className="products-section card">
        <h3>Products</h3>
        <table className="products-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Width</th>
              <th>Height</th>
              <th>Features</th>
              <th>Additional Requirements</th>
            </tr>
          </thead>
          <tbody>
            {order?.product ? (
              <tr>
                <td>{order.product.productName || "N/A"}</td>
                <td>{order.product.width || "N/A"}</td>
                <td>{order.product.height || "N/A"}</td>
                <td>
                  {order.product.features
                    ? Object.entries(order.product.features).map(([key, value], index) => (
                        <div key={index}>
                          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
                          {Array.isArray(value) ? (
                            <ul>
                              {value.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            value
                          )}
                        </div>
                      ))
                    : "No features listed"}
                </td>
                <td>{order.product.additionalRequirements || "None"}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan="5">No products available</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default OrderDetails;
