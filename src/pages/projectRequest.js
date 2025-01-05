import React, { useEffect, useState } from "react";
import { db } from "../services/firebase"; // Import Firestore
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { CSVLink } from "react-csv";
import "../styles/components/projectRequestPage.css"; // Add your styles here
import { useLanguage } from "../context/LanguageContext";

const ProjectRequestPage = () => {
  const [projects, setProjects] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedInstaller, setSelectedInstaller] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Approved");
  const [instructions, setInstructions] = useState({}); // Store instructions for each project
  const [selectedInstruction, setSelectedInstruction] = useState(null); // For editing an instruction
  const [instructionText, setInstructionText] = useState(""); // To store the text input for instructions
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const { language } = useLanguage(); 

  const translations = {
    en: {
      header: "Project Requests",
      searchPlaceholder: "Search projects by project name, dealer or client",
      filterByStatus: "Filter by Status",
      exportCsv: "Export to CSV",
      assignButton: "Assign",
      addInstruction: "Add Instruction",
      editInstruction: "Edit Instruction",
      addInstructionButton: "Add Instruction",
      confirmButton: "Confirm",
      cancelButton: "Cancel",
      clientDetails: "Client Details",
      dealerDetails: "Dealer Details",
      project: "Project",
      features: "Features",
      actions: "Actions",
      installerDetails: "Installer Details",
      deadline: "Deadline",
      instructions: "Instructions",
      acknowledgement: "Acknowledgement",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      installerNotFound: "Installer details not found",
      noInstallerAssigned: "No installer assigned yet",
      noDeadlineSet: "No deadline set",
      notAcknowledgedYet: "Not acknowledged yet",
      installerName: "Installer name",
      installerId: "Installer ID",
      clientName: "Client Name",
      clientPhone: "Client Phone",
      clientCity: "Client City",
      dealerName: "Dealer Name",
      dealerId: "Dealer ID",
      dealerMail: "Dealer Mail",
      noDealerDetails: "No dealer details",
      noClientDetails:"No client details"
    },
    fr: {
      header: "Demandes de projet",
      searchPlaceholder: "Recherchez des projets par nom de projet, revendeur ou client",
      filterByStatus: "Filtrer par statut",
      exportCsv: "Exporter en CSV",
      assignButton: "Attribuer",
      addInstruction: "Ajouter une instruction",
      editInstruction: "Modifier l'instruction",
      addInstructionButton: "Ajouter une instruction",
      confirmButton: "Confirmer",
      cancelButton: "Annuler",
      clientDetails: "Détails du client",
      dealerDetails: "Détails du revendeur",
      project: "Projet",
      features: "Caractéristiques",
      actions: "Actions",
      installerDetails: "Détails de l'installateur",
      deadline: "Date limite",
      instructions: "Instructions",
      acknowledgement: "Accusé de réception",
      previous: "Précédent",
      next: "Suivant",
      page: "Page",
      of: "de",
      installerNotFound: "Détails de l'installateur introuvables",
      noInstallerAssigned: "Aucun installateur assigné pour l'instant",
      noDeadlineSet: "Aucune date limite définie",
      notAcknowledgedYet: "Pas encore reconnu",
      installerName: "Nom de l'installateur",
      installerId: "ID de l'installateur",
      clientName: "Nom du client",
    clientPhone: "Téléphone du client",
    clientCity: "Ville du client",
    dealerName: "Nom du distributeur",
    dealerId: "ID du distributeur",
    dealerMail: "Courriel du distributeur",
    noDealerDetails: "Aucun détail sur le distributeur",
    noClientDetails:"Aucun détail sur le client"
    }
  };

  const t = translations[language];

  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 10;


  const handleAddInstruction = (projectId) => {
    setSelectedProject(projectId);
    setInstructionText(""); // Clear the input field
    setShowInstructionModal(true);
    setSelectedInstruction(null); // No instruction selected for adding
  };

  const handleEditInstruction = (projectId, instruction) => {
    setSelectedProject(projectId);
    setInstructionText(instruction); // Pre-populate the input field with the existing instruction
    setShowInstructionModal(true);
    setSelectedInstruction(instruction); // Mark as editing
  };

  const handleSubmitInstruction = async () => {
    if (!instructionText.trim()) {
      alert("Instruction is required.");
      return;
    }

    const projectRef = doc(db, "Quotation_form", selectedProject);

    await updateDoc(projectRef, {
      installerInstructions: instructionText,
    });

    setInstructions((prev) => ({
      ...prev,
      [selectedProject]: instructionText,
    }));

    alert("Instruction saved successfully!");
    setShowInstructionModal(false); // Close modal
    setSelectedProject(null);
    setInstructionText(""); // Clear input field
  };

  const closeInstructionModal = () => {
    setShowInstructionModal(false);
    setSelectedProject(null);
    setInstructionText(""); // Clear input field
  };


  // Fetch projects and related user details
  useEffect(() => {
    const fetchProjects = async () => {
      const q = query(
        collection(db, "Quotation_form"),
        where("status", "==", selectedStatus)
      );
      const querySnapshot = await getDocs(q);

      const projectData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const project = { id: doc.id, ...doc.data() };

          // Fetch user details (Dealer) using userId
          if (project.userId) {
            const userQuery = query(collection(db, "users"), where("uid", "==", project.userId));
            const userSnapshot = await getDocs(userQuery);
            const user = userSnapshot.docs[0]?.data();
            if (user) {
              project.dealer = user; // Attach dealer details to the project
            }
          }
          return project;
        })
      );

      setProjects(projectData);
    };

    

    const fetchInstallers = async () => {
      const q = query(collection(db, "users"), where("role", "==", "Installer"));
      const querySnapshot = await getDocs(q);
      const installerData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInstallers(installerData);
    };

    fetchProjects();
    fetchInstallers();
  }, [selectedStatus]);

  // Assign a project to an installer
  const handleAssign = (projectId) => {
    setSelectedProject(projectId);
    setShowAssignModal(true);
  };

  const confirmAssignment = async () => {
    if (selectedInstaller && selectedProject) {
      // Find the selected installer's details
      const installer = installers.find((inst) => inst.id === selectedInstaller);

      if (!installer) {
        alert("Installer details not found.");
        return;
      }

      const projectRef = doc(db, "Quotation_form", selectedProject);

      await updateDoc(projectRef, {
        Installer: "Assigned",
        assignedTo: selectedInstaller,
        assignedInstallerName: installer.name,
        assignedInstallerEmail: installer.email,
        installationDeadline: deadline,
      });

      alert("Project assigned successfully!");
      setShowAssignModal(false);
      setSelectedProject(null);
      setSelectedInstaller("");
      setDeadline("");

      // Refresh projects
      setProjects((prev) => prev.filter((p) => p.id !== selectedProject));
    } else {
      alert("Please select an installer.");
    }
  };


  // Export CSV data
  const headers = [
    { label: "Order ID", key: "id" },
    { label: "Client Name", key: "clientName" },
    { label: "Client Phone", key: "clientPhone" },
    { label: "Client City", key: "city" },
    { label: "Project", key: "productName" },
    { label: "Dealer Name", key: "dealerName" },
    { label: "Dealer ID", key: "dealerId" },
    { label: "Dealer Email", key: "dealerEmail" },
    { label: "Installer Assigned", key: "assignedInstallerName" },
    { label: "Installer Email", key: "assignedInstallerEmail" },
    { label: "Deadline", key: "installationDeadline" },
    { label: "Instructions", key: "installerInstructions" },
    { label: "Product Features", key: "productFeatures" },
    { label: "Installer Assigned?", key: "installerAssigned" },
  ];
  

  const Csvdata = projects.map((project) => ({
    id: project.id,
    clientName: project.clientName,
    clientPhone: project.clientPhone,
    city: project.city,
    productName: project.product?.productName,
    dealerName: project.dealer?.name,
    dealerId: project.dealer?.uid,
    dealerEmail: project.dealer?.email,
    assignedInstallerName: project.assignedInstallerName || "N/A",
    assignedInstallerEmail: project.assignedInstallerEmail || "N/A",
    installationDeadline: project.installationDeadline || "N/A",
    installerInstructions: project.installerInstructions || "N/A",
    productFeatures: project.product?.features ? Object.entries(project.product.features).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ') : "No features listed",
    installerAssigned: project.Installer === "Assigned" ? "Yes" : "No",
  }));
  

  // Pagination Logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Move to the previous page
  const prevPage = () => setCurrentPage(currentPage - 1);

  // Move to the next page
  const nextPage = () => setCurrentPage(currentPage + 1);

  // Search and Filter Logic
  const filteredProjects = currentProjects.filter((project) => {
    return (
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.product?.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.dealer && project.dealer.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="project-request-page">
      <h1>{t.header}</h1>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
<div className="filter-status">
<label>{t.filterByStatus} </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          {/* Add more statuses as needed */}
        </select>
        </div>

        <div className="export-button">
        <CSVLink data={Csvdata} headers={headers} filename="project_requests.csv">
          <button>{t.exportCsv}</button>
        </CSVLink>
      </div>
      </div>


      <table className="project-table">
        <thead>
          <tr>
          <th>Order ID</th>
          <th>{t.clientDetails}</th>
          <th>{t.dealerDetails}</th>
          <th>{t.project}</th>
          <th>{t.actions}</th>
          <th>{t.installerDetails}</th>
          <th>{t.deadline}</th>
          <th>{t.instructions}</th>
          <th>{t.acknowledgement}</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr key={project.id}>
              <td>{project.id}</td>
              <td>
                <strong>{t.clientName}: </strong>{project.clientName} <br />
                <strong>{t.clientPhone}: </strong>{project.clientPhone} <br />
                <strong>{t.clientCity}: </strong>{project.city} <br />
              </td>
              <td>
                {project.dealer ? (
                  <>
                    <strong>{t.dealerName}: </strong>{project.dealer.name} <br />
                    <strong>{t.dealerMail}: </strong>{project.dealer.email} <br />
                  </>
                ) : (
                  t.noDealerDetails
                )}
              </td>
              <td>{project.product?.productName}</td>
              <td>
                <button
                  className="assign-btn"
                  onClick={() => handleAssign(project.id)}
                >
                 {t.assignButton}
                </button>
              </td>

              <td>
                {project.Installer === "Assigned" && project.assignedTo ? (
                  installers.find((installer) => installer.id === project.assignedTo) ? (
                    <>
                      <strong>{t.installerName}: </strong>{installers.find((installer) => installer.id === project.assignedTo).name}<br/> 
                      <strong>{t.installerId}: </strong>{installers.find((installer) => installer.id === project.assignedTo).uid}
                    </>
                  ) : (
                    t.installerNotFound
                  )
                ) : (
                  t.noInstallerAssigned
                )}
              </td>

              <td>
            {project.installationDeadline ? project.installationDeadline : t.noDeadlineSet}
            </td>

            <td>
                {project.instructions ? (
                    <div>
                        <ul>
                            <li>{project.installerInstructions || null}</li>
                        </ul>
                  <button className="add-instruction-btn" onClick={() => handleEditInstruction(project.id, project.instructions)}>
                   Add Instruction
                  </button>
                  </div>
                ) : (
                  <button className="add-instruction-btn" onClick={() => handleAddInstruction(project.id)}>{t.addInstruction}</button>
                )}
              </td>
              <td>{project.installerAcknowledgement || t.notAcknowledgedYet}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
        >
          {t.previous}
        </button>
        <span>{t.page} {currentPage}</span>
        <button
          onClick={nextPage}
          disabled={currentPage === Math.ceil(projects.length / projectsPerPage)}
        >
         {t.next}
        </button>
      </div>

      {showInstructionModal && (
  <div className="modal">
    <div className="modal-content">
      <h2>{selectedInstruction ? "Edit Instruction" : "Add Instruction"}</h2>
      <textarea
        value={instructionText}
        onChange={(e) => setInstructionText(e.target.value)}
        placeholder="Enter instructions"
        required
      />
      <div className="modal-actions">
        <button className="confirm-btn" onClick={handleSubmitInstruction}>
          {selectedInstruction ? "Update Instruction" : "Add Instruction"}
        </button>
        <button className="cancel-btn" onClick={closeInstructionModal}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


      {showAssignModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Assign Installer</h2>
            <select
              value={selectedInstaller}
              onChange={(e) => setSelectedInstaller(e.target.value)}
            >
              <option value="">Select Installer</option>
              {installers.map((installer) => (
                <option key={installer.id} value={installer.id}>
                  {installer.name} ({installer.email})
                </option>
              ))}
            </select>

            <div>
                <label>Set Deadline:</label>
                <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                />
            </div>

            <div className="modal-actions">
              <button className="confirm-btn" onClick={confirmAssignment}>
                Confirm
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectRequestPage;
