import React, { useState, useEffect } from "react";
import { collection, doc, updateDoc, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import "../styles/components/UserManagementPage.css";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatedDetails, setUpdatedDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    companyName: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserDetails, setNewUserDetails] = useState({ name: "", email: "", role: "Installer", status: "Active", phone: "",
    address: "",
    companyName: "",
    role: "Installer", });
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    // Using onSnapshot to listen to real-time changes
    const q = query(collection(db, "users"), where("role", "==", "Installer"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    // Cleanup the listener when the component is unmounted
    return () => unsubscribe();
  }, []);

  const handleAddUser = async () => {
    try {
      await addDoc(collection(db, "users"), newUserDetails);
      setIsAddUserModalOpen(false);
    } catch (error) {
      console.error("Error adding installer:", error);
    }
  };

  const handleEditUser = (installer) => {
    setSelectedUser(installer);
    setUpdatedDetails({
      name: installer.name,
      email: installer.email,
      phone: installer.phone || "", // Add phone if it exists
      address: installer.address || "", // Add address if it exists
      companyName: installer.companyName || "", // Add companyName if it exists
    });
    setIsModalOpen(true);
  };

  const handleSaveChanges = async () => {
    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, updatedDetails);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeactivateUser = (user) => {
    updateUserStatus(user, "Inactive");
  };

  const handleBlockUser = (user) => {
    const confirmBlock = window.confirm("Are you sure you want to block this user?");
    if (confirmBlock) {
      updateUserStatus(user, "Blocked");
    }
  };

  const updateUserStatus = async (user, status) => {
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { status });
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const filteredUsers = users
    .filter((user) => user.role === "Installer") // Ensure only Dealers are displayed
    .filter((user) =>
      statusFilter === "All" || user.status === statusFilter
    )
    .filter((user) => {
      const name = user.name || ""; // Fallback to an empty string if undefined
      const email = user.email || ""; // Fallback to an empty string if undefined
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  // Bulk actions (Simulated)
  const handleBulkAction = (action) => {
    const selectedUsers = users.filter((user) => user.selected);
    selectedUsers.forEach((user) => updateUserStatus(user, action));
  };

  const handleStatusToggle = (user) => {
    if (user.status === "Inactive") {
      updateUserStatus(user, "Active");
    } else if (user.status === "Active") {
      updateUserStatus(user, "Inactive");
    }
  };

  const handleBlockToggle = (user) => {
    if(user.status === "Blocked"){
        const confirmBlock = window.confirm("Are you sure you want to activate this user?");
        if (confirmBlock){
        updateUserStatus(user,"Active")
        }
    } else if (user.status === "Active"){
        const confirmBlock = window.confirm("Are you sure you want to block this user?");
            if (confirmBlock) {
            updateUserStatus(user, "Blocked");
            }
    }
  }

  return (
    <div className="user-management-page">
      <header className="header">
        <h1>Dealer Management</h1>
        <button
          className="add-user-button"
          onClick={() => setIsAddUserModalOpen(true)}
        >
          + Add Installer
        </button>
      </header>

      <div className="filters">
        <input
          type="text"
          placeholder="Search dealers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter}>
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Blocked">Blocked</option>
        </select>
      </div>

      <div className="bulk-actions">
        <button onClick={() => handleBulkAction("Inactive")}>Bulk Deactivate</button>
        <button onClick={() => handleBulkAction("Blocked")}>Bulk Block</button>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>Select</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  onChange={() => (user.selected = !user.selected)}
                />
              </td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>
                <button onClick={() => handleEditUser(user)}>Edit</button>
                <button onClick={() => handleStatusToggle(user)}>
                  {user.status === "Inactive" ? "Activate" : "Deactivate"}
                </button>
                <button onClick={() => handleBlockToggle(user)}>{user.status === "Blocked" ? "Unblock" : "Block"}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
          <h2>Edit Installer</h2>
          <label>Name:</label>
          <input
            type="text"
            value={updatedDetails.name || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <label>Email:</label>
          <input
            type="text"
            value={updatedDetails.email || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <label>Phone:</label>
          <input
            type="text"
            value={updatedDetails.phone || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <label>Address:</label>
          <input
            type="text"
            value={updatedDetails.address || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, address: e.target.value }))
            }
          />
          <label>Company Name:</label>
          <input
            type="text"
            value={updatedDetails.companyName || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, companyName: e.target.value }))
            }
          />
          <button onClick={handleSaveChanges} className="save-button">Save Changes</button>
          <button onClick={() => setIsModalOpen(false)} className="modal-close">Close</button>
          </div>
        </div>
        
      )}

{isAddUserModalOpen&& (
        <div className="modal">
          <div className="modal-content">
          <h2>Add Installer</h2>
          <label>Name:</label>
          <input
            type="text"
            value={newUserDetails.name}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <label>Email:</label>
          <input
            type="text"
            value={newUserDetails.email}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <label>Phone:</label>
          <input
            type="text"
            value={newUserDetails.phone}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <label>Address:</label>
          <input
            type="text"
            value={newUserDetails.address}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, address: e.target.value }))
            }
          />
          <label>Company Name:</label>
          <input
            type="text"
            value={newUserDetails.companyName}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, companyName: e.target.value }))
            }
          />
          <label>Role:</label>
          <input type="text" value="Installer" disabled />
          <button onClick={handleAddUser}>Add Installer</button>
          <button onClick={() => setIsAddUserModalOpen(false)}>Close</button>
        </div>
        </div>
      )}
      
    </div>
  );
};

export default UserManagementPage;
