import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { CSVLink } from "react-csv";
import { toast } from "react-toastify";
import "../styles/components/projectPage.css";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [error, setError] = useState(null);

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
      <h1>My Projects</h1>

      {loading ? <p className="loading-state">Loading...</p> : (
        <>
          <div className="search-bar">
            <input type="text" placeholder="Search" onChange={(e) => setSearchTerm(e.target.value)} />
            <select onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
            </select>
            <select onChange={(e) => setSortOrder(e.target.value)}>
              <option value="asc">Sort Ascending</option>
              <option value="desc">Sort Descending</option>
            </select>
    
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="project-list">
            {sortedProjects.map(project => (
              <div key={project.id} className="project-card">
                <div className="card-header">
                  <h3>#{project.orderNumber}</h3>
                  
                </div>

                <div className="card-body">
                <h4>Client Details</h4>
                  <p><strong>Name:</strong> {project.clientName}</p>
                  <p><strong>Email:</strong> {project.clientEmail}</p>
                  <p><strong>Phone:</strong> {project.clientPhone}</p>

                  <h4>Product Details</h4>
                  <p><strong>Product Name:</strong> {project.product?.productName}</p>
                  <p><strong>Category:</strong> {project.product?.category}</p>
                  <p><strong>Dimensions:</strong> {project.product?.width} x {project.product?.height}</p>

                  <h4>Additional Details</h4>
                  <ul>
                    {project.product?.features ? Object.entries(project.product.features).map(([key, value], index) => (
                      <div key={index}>
                        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {Array.isArray(value) ? value.join(", ") : value}
                      </div>
                    )) : <div>No Additional Details listed.</div>}
                  </ul>
                </div>

                <div className="card-footer">
                  <button onClick={() => handleConfirmProject(project.id)} className={`confirm-btn ${project.installerAcknowledgement === "Confirmed" ? "disabled" : ""}`}>
                    {project.installerAcknowledgement === "Confirmed" ? "Confirmed" : "Confirm Project"}
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
