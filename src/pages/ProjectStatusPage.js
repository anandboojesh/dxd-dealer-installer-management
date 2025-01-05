import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import "../styles/components/projectStatusPage.css";
import { useLanguage } from "../context/LanguageContext";

const ProjectStatusPage = () => {
  const [requestedProjects, setRequestedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 5; // Number of projects to display per page
  const { language } = useLanguage(); 

  const translations = {
    en: {
      pageTitle: "Project Status",
      searchPlaceholder: "Search by project name...",
      filterAll: "All",
      filterInstallationStarted: "Installation Started",
      filterOngoing: "Ongoing",
      filterCompleted: "Completed",
      loading: "Loading your project requests...",
      error: "Failed to load your projects. Please try again later.",
      noProjects: "No projects match your criteria.",
      projectName: "Project Name",
      orderID: "Order ID",
      status: "Status",
      category: "Category",
      workStatus: "Work Status",
      deadline: "Deadline",
      selectStatus: "Select Status",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
    },
    fr: {
      pageTitle: "Statut du projet",
      searchPlaceholder: "Rechercher par nom de projet...",
      filterAll: "Tous",
      filterInstallationStarted: "Installation commencée",
      filterOngoing: "En cours",
      filterCompleted: "Terminé",
      loading: "Chargement de vos demandes de projet...",
      error: "Échec du chargement de vos projets. Veuillez réessayer plus tard.",
      noProjects: "Aucun projet ne correspond à vos critères.",
      projectName: "Nom du projet",
      orderID: "ID de commande",
      status: "Statut",
      category: "Catégorie",
      workStatus: "Statut du travail",
      deadline: "Date limite",
      selectStatus: "Sélectionner le statut",
      previous: "Précédent",
      next: "Suivant",
      page: "Page",
      of: "de",
    },
  };
  
  const t = translations[language];
  

  useEffect(() => {
    const fetchRequestedProjects = async () => {
      try {
        const currentUserUid = auth.currentUser.uid;
        const q = query(
          collection(db, "Quotation_form"),
          where("assignedTo", "==", currentUserUid)
        );
        const querySnapshot = await getDocs(q);

        const projectList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((project) => project.installerAcknowledgement === "Confirmed");

        setRequestedProjects(projectList);
      } catch (error) {
        console.error("Error fetching requested projects: ", error);
        setError("Failed to load your projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestedProjects();
  }, []);

  const handleWorkStatusChange = async (projectId, newStatus) => {
    try {
      const projectRef = doc(db, "Quotation_form", projectId);
      await updateDoc(projectRef, {
        workStatus: newStatus,
      });
  
      // Update the local state to reflect the new status
      setRequestedProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId ? { ...project, workStatus: newStatus } : project
        )
      );
    } catch (error) {
      console.error("Error updating work status:", error);
    }
  };
  

  // Filter and search logic
  const filteredProjects = requestedProjects.filter((project) => {
    const matchesSearch = project.product?.productName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "All" || project.workStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <div className="unique-project-status-page">
      <h1>{t.pageTitle}</h1>

      {/* Search and Filter Section */}
      <div className="unique-search-filter-container">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="unique-search-input"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="unique-filter-select"
        >
          <option value="All">{t.filterAll}</option>
          <option value="Installation Started">{t.filterInstallationStarted}</option>
          <option value="Ongoing">{t.filterOngoing}</option>
          <option value="Completed">{t.filterCompleted}</option>
        </select>
      </div>

      {loading ? (
        <p>{t.loading}</p>
      ) : error ? (
        <p className="unique-error-message">{error}</p>
      ) : currentProjects.length === 0 ? (
        <p>{t.noProjects}</p>
      ) : (
        <>
          <table className="unique-project-table">
            <thead>
              <tr>
                <th>{t.projectName}</th>
                <th>{t.orderID}</th>
                <th>{t.status}</th>
                <th>{t.category}</th>
                <th>{t.workStatus}</th>
                <th>{t.deadline}</th>
              </tr>
            </thead>
            <tbody>
              {currentProjects.map((project) => (
                <tr key={project.id} className="unique-project-row">
                  <td>{project.product?.productName}</td>
                  <td>{project.orderNumber}</td>
                  <td>{project.status || "Pending"}</td>
                  <td>{project.product?.category || "N/A"}</td>
                  <td>
                      <select
                        value={project.workStatus || "default"} // Set the current status as the default value
                        onChange={(e) => handleWorkStatusChange(project.id, e.target.value)}
                      >
                        <option value="default" disabled>Select Status</option>
                        <option value="Installation Started">Installation Started</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                  <td>{project.installationDeadline || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="unique-pagination-container">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="unique-pagination-button"
            >
              {t.previous}
            </button>
            <span>
            {t.page} {currentPage} {t.of} {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="unique-pagination-button"
            >
              {t.next}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectStatusPage;
