import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { CSVLink } from "react-csv";
import { toast } from "react-toastify";
import "../styles/components/projectPage.css";
import { useLanguage } from "../context/LanguageContext";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [error, setError] = useState(null);
  const { language } = useLanguage();

  const translations = {
    en: {
      pageTitle: "My Projects",
      loading: "Loading...",
      searchPlaceholder: "Search",
      filterAll: "All Status",
      filterPending: "Pending",
      filterConfirmed: "Confirmed",
      sortAsc: "Sort Ascending",
      sortDesc: "Sort Descending",
      clientDetails: "Client Details",
      clientName: "Name",
      clientEmail: "Email",
      clientPhone: "Phone",
      productDetails: "Product Details",
      productName: "Product Name",
      productCategory: "Category",
      productDimensions: "Dimensions",
      additionalDetails: "Additional Details",
      noAdditionalDetails: "No Additional Details listed.",
      confirmProject: "Confirm Project",
      projectConfirmed: "Confirmed",
      successMessage: "Project confirmed successfully!",
      errorLoadingProjects: "Failed to load projects.",
      errorConfirmingProject: "Error confirming project.",
      orderNumber: "Order Number",
    },
    fr: {
      pageTitle: "Mes Projets",
      loading: "Chargement...",
      searchPlaceholder: "Rechercher",
      filterAll: "Tous les statuts",
      filterPending: "En attente",
      filterConfirmed: "Confirmé",
      sortAsc: "Trier par ordre croissant",
      sortDesc: "Trier par ordre décroissant",
      clientDetails: "Détails du client",
      clientName: "Nom",
      clientEmail: "E-mail",
      clientPhone: "Téléphone",
      productDetails: "Détails du produit",
      productName: "Nom du produit",
      productCategory: "Catégorie",
      productDimensions: "Dimensions",
      additionalDetails: "Détails supplémentaires",
      noAdditionalDetails: "Aucun détail supplémentaire répertorié.",
      confirmProject: "Confirmer le projet",
      projectConfirmed: "Confirmé",
      successMessage: "Projet confirmé avec succès !",
      errorLoadingProjects: "Échec du chargement des projets.",
      errorConfirmingProject: "Erreur lors de la confirmation du projet.",
      orderNumber: "Numéro de commande",
    },
  };

  const t = translations[language];

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const quotationsRef = collection(db, "Quotation_form");
        const q = query(quotationsRef, where("assignedTo", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser]);

  const filteredProjects = projects.filter(project => {
    return (
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.product?.productName.toLowerCase().includes(searchTerm.toLocaleLowerCase())
      &&
      (statusFilter ? project.status === statusFilter : true)
    );
  });

  const sortedProjects = filteredProjects.sort((a, b) => {
    return sortOrder === "asc" ? a.clientName.localeCompare(b.clientName) : b.clientName.localeCompare(a.clientName);
  });

  const handleConfirmProject = async (projectId) => {
    try {
      const projectRef = doc(db, "Quotation_form", projectId);
      await updateDoc(projectRef, { installerAcknowledgement: "Confirmed", AcknowledgementTime: Timestamp.now() });
      toast.success("Project confirmed successfully!");
    } catch (error) {
      setError("Error confirming project.");
    }
  };

  return (
    <div className="projects-container">
      <h1>{t.pageTitle}</h1>

      {loading ? (
        <p className="loading-state">{t.loading}</p>
      ) : (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">{t.filterAll}</option>
              <option value="Pending">{t.filterPending}</option>
              <option value="Confirmed">{t.filterConfirmed}</option>
            </select>
            <select onChange={(e) => setSortOrder(e.target.value)}>
              <option value="asc">{t.sortAsc}</option>
              <option value="desc">{t.sortDesc}</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="project-list">
            {sortedProjects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="card-header">
                  <h3>{t.orderNumber}: {project.orderNumber}</h3>
                </div>
                <div className="card-body">
                  <h4>{t.clientDetails}</h4>
                  <p><strong>{t.clientName}:</strong> {project.clientName}</p>
                  <p><strong>{t.clientEmail}:</strong> {project.clientEmail}</p>
                  <p><strong>{t.clientPhone}:</strong> {project.clientPhone}</p>

                  <h4>{t.productDetails}</h4>
                  <p><strong>{t.productName}:</strong> {project.product?.productName}</p>
                  <p><strong>{t.productCategory}:</strong> {project.product?.category}</p>
                  <p><strong>{t.productDimensions}:</strong> {project.product?.width} x {project.product?.height}</p>

                  <h4>{t.additionalDetails}</h4>
                  <ul>
                    {project.product?.features
                      ? Object.entries(project.product.features).map(([key, value], index) => (
                          <li key={index}>
                            <strong>{key}:</strong> {Array.isArray(value) ? value.join(", ") : value}
                          </li>
                        ))
                      : <li>{t.noAdditionalDetails}</li>}
                  </ul>
                </div>

                <div className="card-footer">
                  <button
                    onClick={() => handleConfirmProject(project.id)}
                    className={`confirm-btn ${
                      project.installerAcknowledgement === "Confirmed" ? "disabled" : ""
                    }`}
                  >
                    {project.installerAcknowledgement === "Confirmed"
                      ? t.projectConfirmed
                      : t.confirmProject}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectsPage;