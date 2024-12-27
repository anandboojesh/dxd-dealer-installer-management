import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { getDoc, doc, collection, getDocs, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import "../styles/components/InstallerDashboard.css";
import { Pie, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend,ArcElement,PointElement,LineElement, // Import LineElement
} from "chart.js";
import firebase from "firebase/compat/app";

// Register chart elements
ChartJS.register(
  CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend,ArcElement,PointElement,LineElement // Register LineElement for the Line chart
);

const InstallerDashboard = () => {
  const [installerName, setInstallerName] = useState("");
  const [projects, setProjects] = useState([]);
  const [visibleProjects, setVisibleProjects] = useState([]);  // State for visible projects
  const [showAllProjects, setShowAllProjects] = useState(false);  // State to toggle showing all projects
  const [notifications, setNotifications] = useState([]);
  const [projectStatusCounts, setProjectStatusCounts] = useState({});
  const [workStatusCounts, setWorkStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [requestedProjects, setRequestedProjects] = useState([]);
  const [completionNotes, setCompletionNotes] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedPhotoURLs = [];
  
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `files/${files.name}`); // Ensure file.name exists
      await uploadBytes(storageRef, files);
      const fileURL = await getDownloadURL(storageRef); // Get the file URL after successful upload
      setUploadedPhotos(fileURL); // Update state with file URL
      alert("File uploaded successfully.");
    } catch (error) {
      console.error("File upload error:", error);
      alert(error);
    }
  };

  const submitCompletionDetails = async () => {
    try {
      const completionData = {
        projectId: selectedProjectId,
        installerId: auth.currentUser.uid,
        notes: completionNotes,
        photoURLs: uploadedPhotos,
        completedAt: new Date(),
      };
  
      await addDoc(collection(db, "Quotation_form"), completionData);
  
      alert("Project marked as completed successfully!");
      setShowCompletionModal(false);
      setCompletionNotes("");
      setUploadedPhotos([]);
      window.location.reload(); // Refresh to update status
    } catch (err) {
      console.error("Error submitting completion details:", err);
      alert("An error occurred while submitting details. Please try again.");
    }
  };
  


  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
    } else {
      const fetchInstallerData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const { name } = userDoc.data();
            setInstallerName(name);

            const projectsSnapshot = await getDocs(
              collection(db, "Quotation_form")
            );
            const projectList = projectsSnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(project => project.assignedTo === auth.currentUser.uid);

            setProjects(projectList);

            // Set the first two projects initially
            setVisibleProjects(projectList.slice(0, 2));

            const Workcounts = projectList.reduce((counts, project) => {
              counts[project.workStatus] = (counts[project.workStatus] || 0) + 1;
              return counts
            }, {});
            setWorkStatusCounts(Workcounts) 

            // Calculate project status counts
            const statusCounts = projectList.reduce((counts, project) => {
              counts[project.status] = (counts[project.status] || 0) + 1;
              return counts;
            }, {});
            setProjectStatusCounts(statusCounts);

           

            const notificationsSnapshot = await getDocs(
              collection(db, "Notification")
            );
            const notificationsList = notificationsSnapshot.docs
              .map(doc => doc.data())
              .filter(notification => notification.userId === auth.currentUser.uid);
            setNotifications(notificationsList);
          } else {
            setError("No user data found.");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("An error occurred while fetching data. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      fetchInstallerData();
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const refreshProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Project_request"));
      const refreshedProjects = [];
      querySnapshot.forEach(doc => {
        refreshedProjects.push({ id: doc.id, ...doc.data() });
      });
      setProjects(refreshedProjects); // Update the state with refreshed data
      console.log("Projects refreshed:", refreshedProjects);
    } catch (err) {
      console.error("Error refreshing projects:", err);
    }
  };
  

  const handleStatusSelect = async (projectId, newStatus) => {

    if (newStatus === "Completed") {
      setSelectedProjectId(projectId); // Track the project ID
      setShowCompletionModal(true); // Show the modal for notes and photos
      return;
    }

    try {
      await updateDoc(doc(db, "Quotation_form", projectId), { workStatus: newStatus });
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId ? { ...project, workStatus: newStatus } : project
        )
      );
      setShowStatusOptions(false);
      window.location.reload();
    } catch (err) {
      console.error("Error updating project status:", err);
    }
  };

   // Function to handle Work Status update
   const handleWorkStatusChange = async (projectId, newStatus) => {
    const projectRef = doc(db, "Project_request", projectId);
    await updateDoc(projectRef, {
      workStatus: newStatus,
    });
  };

  // Function to handle deleting the request
  const handleDeleteRequest = async (projectId) => {
    const projectRef = doc(db, "Project_request", projectId);
    await deleteDoc(projectRef);
    // Optionally, update the UI to remove the deleted request
    setRequestedProjects(requestedProjects.filter((project) => project.id !== projectId));
  };

  // Function to notify admin (placeholder function)
  const handleNotifyAdmin = async (projectId) => {
     const adminId = "4RdT9OAyUZVK7q5cy16yy71tVMl2"; // Admin's UID
     const project = requestedProjects.find((project) => project.id === projectId);
     if (!project) {
       alert("Project not found.");
       return;
     }
   
     try {
       const currentTimestamp = new Date();
   
       await addDoc(collection(db, "Notification"), {
         message: `A new project request for "${project.projectName}" has been submitted by "${project.installerName}" and is now under review. Please review the request and take appropriate action.`,
         userId: adminId,
         createdAt: currentTimestamp,
         read: "false",
         type: "alert",
       });
   
       const projectRef = doc(db, "Project_request", projectId);
       await updateDoc(projectRef, {
         lastNotificationTime: currentTimestamp,
       });
   
       // Update the local state immediately
       setRequestedProjects((prevProjects) =>
         prevProjects.map((proj) =>
           proj.id === projectId
             ? { ...proj, lastNotificationTime: currentTimestamp }
             : proj
         )
       );
   
       alert("Admin has been notified successfully.");
     } catch (error) {
       console.log("Error sending notification: ", error);
       alert("Error sending notification: " + error.message);
     }
   };
   
 
   const isNotifyDisabled = (lastNotificationTime) => {
     if (!lastNotificationTime) return false;
   
     const currentTime = new Date();
     const notificationTime =
       lastNotificationTime instanceof Date
         ? lastNotificationTime // Already a JavaScript Date
         : lastNotificationTime.toDate(); // Convert Firestore Timestamp to Date
   
     const timeDifference = (currentTime - notificationTime) / (1000 * 60 * 60); // Time difference in hours
   
     return timeDifference < 12; // Disable if less than 12 hours
   };

  

  const handleStatusButtonClick = (projectId) => {
    setSelectedProjectId(projectId);
    setShowStatusOptions(true);
  };

  const barData = {
    labels: ["Assigned Projects"],
    datasets: [
      {
        label: "No. of Projects",
        data: [projects.length],
        backgroundColor: "#36A2EB",
      },
    ],
  };


  const ProjectItem = ({ project }) => (
    <div className="project-item">
      <h5><strong>Project:</strong> {project.product?.productName}</h5>
      <h4>Client Details</h4>
      <p><strong>Client Name:</strong> {project.clientName || "N/A"}</p>
      <p><strong>Client Phone:</strong> {project.clientPhone || "N/A"}</p>
      <p><strong>Client Email:</strong> {project.clientEmail || "N/A"}</p>
      <p><strong>Client location:</strong> {project.city || "N/A"}</p>
      <h4>Installer Details</h4>
      <p><strong>Installer Name:</strong> {project.assignedInstallerName || "N/A"}</p>
      <p><strong>Installer ID:</strong> {project.assignedTo|| "N/A"}</p>
      <p><strong>Acknowledgement:</strong> {project.installerAcknowledgement || "Pending"}</p>
      <div className="project-actions">
      {project.installerAcknowledgement === "Confirmed" && (
        <>
          <button
            className="status-button"
            onClick={() => handleStatusButtonClick(project.id)} // Open status options for this project
          >
            {project.workStatus || "Update Work Status"}
          </button>
          {selectedProjectId === project.id && showStatusOptions && (
            <div className="status-options">
              <button onClick={() => handleStatusSelect(project.id, "Installation Started")}>
                Installation Started
              </button>
              <button onClick={() => handleStatusSelect(project.id, "On-Going")}>
                On-Going
              </button>
              <button onClick={() => handleStatusSelect(project.id, "Completed")}>
                Completed
              </button>
            </div>
          )}
          </>
        )}
      {/* Show Notify Admin button only if status is "Pending" */}
      {project.status === "Pending" && (
        <button
          className="notify-admin-button"
          onClick={() => handleNotifyAdmin(project.id)}
          disabled={isNotifyDisabled(project.lastNotificationTime)}
        >
          Notify Admin
        </button>
      )}
      </div>
      
    </div>
  );

  const handleViewAllProjects = () => {
    setShowAllProjects(true);
    setVisibleProjects(projects);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Installer Dashboard</h1>
      </div>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div>
          <h2>Welcome, {installerName}</h2>

          

          {/* Projects Section */}
          <div className="dashboard-section projects-section">
            <h3>Task Summary</h3>
            <div className="container1">
              {visibleProjects.length > 0 ? (
                visibleProjects.map(project => (
                  <ProjectItem key={project.id} project={project} />
                ))
              ) : (
                <p>No projects assigned.</p>
              )}
              {!showAllProjects && (
              <button className="view-all-button" onClick={() => navigate('/status')}>
                View All Projects
              </button>
            )}
            </div>
            
          </div>

          {showCompletionModal && (
            <div className="modal">
              <div className="modal-content">
              <h3>Mark Project as Completed</h3>
              <textarea
                placeholder="Add notes (optional)"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
              />
              <button onClick={submitCompletionDetails}>Submit</button>
              <button onClick={() => setShowCompletionModal(false)}>Cancel</button>
              </div>
            </div>
          )}


          {/* Project Status Section */}
          <div className="dashboard-section project-status-section">
            <h3>Assignment Summary</h3>
            <div className="chart-container">
            <Bar data={barData}  options={{
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
              }} />
              </div>
            <div className="status-summary">
            <p>Total Projects: {projects.length}</p>
              {Object.keys(projectStatusCounts).length > 0 ? (
                Object.entries(projectStatusCounts).map(([status, count]) => (
                  <p key={status}><strong>Assigned:</strong> {count}</p>
                ))
              ) : (
                <p>No projects available to display status.</p>
              )}
            </div>
          </div>

           {/* Display work status counts */}
    <div className="dashboard-section projects-section">
    <h3>Work Summary</h3>
      <p><strong>Installation Started:</strong> {workStatusCounts["Installation Started"] || 0}</p>
      <p><strong>On-Going:</strong> {workStatusCounts["On-Going"] || 0}</p>
      <p><strong>Completed:</strong> {workStatusCounts["Completed"] || 0}</p>

       {/* Pie Chart for Work Summary */}
  <div className="piChart-container">
    <Pie
      data={{
        labels: ["Installation Started", "On-Going", "Completed"],
        datasets: [
          {
            label: "Work Status",
            data: [
              workStatusCounts["Installation Started"] || 0,
              workStatusCounts["On-Going"] || 0,
              workStatusCounts["Completed"] || 0,
            ],
            backgroundColor: ["#FF6384", "#36A2EB", "#4BC0C0"], // Colors for each section
            hoverBackgroundColor: ["#FF6384AA", "#36A2EBAA", "#4BC0C0AA"], // Hover effect colors
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: "top", // Adjust position of legend
          },
        },
      }}
    />
  </div>
    </div>
        </div>
      )}
    </div>
  );
};

export default InstallerDashboard;
