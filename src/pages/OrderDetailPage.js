import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import "../styles/components/OrderDetails.css";
import { useLanguage } from "../context/LanguageContext";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { language } = useLanguage();

  const translations = {
    en: {
      back: "Back",
      orderDetails: "Order Details",
      orderId: "Order ID",
      date: "Date",
      status: "Status",
      unknownStatus: "Unknown Status",
      customer: "Customer",
      name: "Name",
      email: "Email",
      phone: "Phone",
      address: "Address",
      city: "City",
      postalCode: "Postal Code",
      priceInfo: "Price Info",
      estimatedPrice: "Estimated Price",
      commissionPrice: "Commission Price",
      commissionPercentage: "Commission Percentage",
      paymentInfo: "Payment Info",
      payableAmount: "Payable Amount",
      paid: "Paid",
      yes: "Yes",
      no: "No",
      installerInfo: "Installer Info",
      installerStatus: "Installer Status",
      installerName: "Installer Name",
      installerId: "Installer ID",
      installerAcknowledgement: "Installer Acknowledgement",
      products: "Products",
      productName: "Product Name",
      width: "Width",
      height: "Height",
      features: "Features",
      additionalRequirements: "Additional Requirements",
      noFeatures: "No features listed",
      none: "None",
      noProducts: "No products available",
      orderNotFound: "Order not found.",
      loading: "Loading...",
      errorFetching: "An error occurred while fetching order details.",
    },
    fr: {
      back: "Retour",
      orderDetails: "Détails de la commande",
      orderId: "ID de commande",
      date: "Date",
      status: "Statut",
      unknownStatus: "Statut inconnu",
      customer: "Client",
      name: "Nom",
      email: "E-mail",
      phone: "Téléphone",
      address: "Adresse",
      city: "Ville",
      postalCode: "Code postal",
      priceInfo: "Informations sur le prix",
      estimatedPrice: "Prix estimé",
      commissionPrice: "Prix de la commission",
      commissionPercentage: "Pourcentage de commission",
      paymentInfo: "Informations sur le paiement",
      payableAmount: "Montant payable",
      paid: "Payé",
      yes: "Oui",
      no: "Non",
      installerInfo: "Informations sur l'installateur",
      installerStatus: "Statut de l'installateur",
      installerName: "Nom de l'installateur",
      installerId: "ID de l'installateur",
      installerAcknowledgement: "Accusé de réception de l'installateur",
      products: "Produits",
      productName: "Nom du produit",
      width: "Largeur",
      height: "Hauteur",
      features: "Caractéristiques",
      additionalRequirements: "Exigences supplémentaires",
      noFeatures: "Aucune caractéristique répertoriée",
      none: "Aucun",
      noProducts: "Aucun produit disponible",
      orderNotFound: "Commande introuvable.",
      loading: "Chargement...",
      errorFetching: "Une erreur s'est produite lors de la récupération des détails de la commande.",
    },
  };

  const t = translations[language];

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderDoc = await getDoc(doc(db, "Quotation_form", orderId));
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          console.log("Order data:", orderData); // Debug: Check structure of fetched data
          setOrder(orderData);
        } else {
          setError(t.orderNotFound);
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(t.errorFetching);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, t]);

  if (loading) {
    return <p>{t.loading}</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="order-details-container">
      <button onClick={() => navigate(-1)} className="back-button">
        {t.back}
      </button>
      <header className="order-header">
        <h2>{t.orderDetails}</h2>
        <p>
          {t.orderId}: <strong>#{orderId}</strong>
        </p>
        <p>{t.date}: {new Date(order?.timestamp || Date.now()).toLocaleDateString()}</p>
        <span className={`status ${order?.status?.toLowerCase() || "unknown"}`}>
          {order?.status || t.unknownStatus}
        </span>
      </header>

      <div className="order-details-grid">
        <section className="customer-info card">
          <h3>{t.customer}</h3>
          <p><strong>{t.name}:</strong> {order?.clientName || "N/A"}</p>
          <p><strong>{t.email}:</strong> {order?.clientEmail || "N/A"}</p>
          <p><strong>{t.phone}:</strong> {order?.clientPhone || "N/A"}</p>
          <p><strong>{t.address}:</strong> {order?.clientAddress || "N/A"}</p>
          <p><strong>{t.city}:</strong> {order?.city || "N/A"}</p>
          <p><strong>{t.postalCode}:</strong> {order?.postalCode || "N/A"}</p>
        </section>

        <section className="order-info card">
          <h3>{t.priceInfo}</h3>
          <p><strong>{t.estimatedPrice}:</strong>₹ {order?.estimatePrice || 0}.00</p>
          <p><strong>{t.commissionPrice}:</strong>₹ {order?.commissionValue || 0}.00</p>
          <p><strong>{t.commissionPercentage}:</strong> {order?.commissionPercentage || 0}%</p>
        </section>

        <section className="payment-info card">
          <h3>{t.paymentInfo}</h3>
          <p><strong>{t.payableAmount}:</strong>₹ {order?.estimatePrice || 0}.00</p>
          <p><strong>{t.paid}:</strong> {order?.paymentStatus === "Complete" ? t.yes : t.no}</p>
          <p><strong>{t.status}:</strong> {order?.paymentStatus || "N/A"}</p>
        </section>

        <section className="payment-info card">
          <h3>{t.installerInfo}</h3>
          <p><strong>{t.installerStatus}:</strong> {order?.Installer || t.installerAcknowledgement}</p>
          <p><strong>{t.installerName}:</strong> {order?.assignedInstallerName || "N/A"}</p>
          <p><strong>{t.installerId}:</strong> {order?.assignedTo || "N/A"}</p>
          <p><strong>{t.installerAcknowledgement}:</strong> {order?.installerAcknowledgement || "N/A"}</p>
        </section>
      </div>

      <section className="products-section card">
        <h3>{t.products}</h3>
        <table className="products-table">
          <thead>
            <tr>
              <th>{t.productName}</th>
              <th>{t.width}</th>
              <th>{t.height}</th>
              <th>{t.features}</th>
              <th>{t.additionalRequirements}</th>
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
                    : t.noFeatures}
                </td>
                <td>{order.product.additionalRequirements || t.none}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan="5">{t.noProducts}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default OrderDetails;
