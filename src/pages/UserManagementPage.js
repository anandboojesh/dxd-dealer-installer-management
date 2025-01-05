import React, { useState, useEffect } from "react";
import { collection, doc, updateDoc, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import "../styles/components/UserManagementPage.css";
import { useLanguage } from "../context/LanguageContext";

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
  const [newUserDetails, setNewUserDetails] = useState({ name: "", email: "", role: "Dealer", status: "Active", phone: "",
    address: "",
    companyName: "",
    role: "Dealer", });
  const [statusFilter, setStatusFilter] = useState("All");
  const { language } = useLanguage(); 


  const translations = {
    en: {
      header: "Dealer Management",
      addDealer: "+ Add Dealer",
      searchPlaceholder: "Search dealers...",
      allStatuses: "All",
      active: "Active",
      inactive: "Inactive",
      blocked: "Blocked",
      bulkDeactivate: "Bulk Deactivate",
      bulkBlock: "Bulk Block",
      name: "Name",
      email: "Email",
      role: "Role",
      status: "Status",
      actions: "Actions",
      edit: "Edit",
      activate: "Activate",
      deactivate: "Deactivate",
      unblock: "Unblock",
      block: "Block",
      editDealer: "Edit Dealer",
      addDealerTitle: "Add Dealer",
      saveChanges: "Save Changes",
      close: "Close",
      phone: "Phone",
      address: "Address",
      companyName: "Company Name",
    },
    fr: {
      header: "Gestion des revendeurs",
      addDealer: "+ Ajouter un revendeur",
      searchPlaceholder: "Rechercher des revendeurs...",
      allStatuses: "Tous",
      active: "Actif",
      inactive: "Inactif",
      blocked: "Bloqué",
      bulkDeactivate: "Désactivation en masse",
      bulkBlock: "Blocage en masse",
      name: "Nom",
      email: "Courriel",
      role: "Rôle",
      status: "Statut",
      actions: "Actions",
      edit: "Modifier",
      activate: "Activer",
      deactivate: "Désactiver",
      unblock: "Débloquer",
      block: "Bloquer",
      editDealer: "Modifier le revendeur",
      addDealerTitle: "Ajouter un revendeur",
      saveChanges: "Enregistrer les modifications",
      close: "Fermer",
      phone: "Téléphone",
      address: "Adresse",
      companyName: "Nom de l'entreprise",
    },
  };


  const t = translations[language];
  

  useEffect(() => {
    // Using onSnapshot to listen to real-time changes
    const q = query(collection(db, "users"), where("role", "==", "Dealer"));
    
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

  const handleEditUser = (Dealer) => {
    setSelectedUser(Dealer);
    setUpdatedDetails({
      name: Dealer.name || null,
      email: Dealer.email || null,
      phone: Dealer.phone || null, // Add phone if it exists
      address: Dealer.address || null, // Add address if it exists
      companyName: Dealer.companyName || null, // Add companyName if it exists
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
    .filter((user) => user.role === "Dealer") // Ensure only Dealers are displayed
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
    } else if (user.status === "Active" || user.status === "Inactive"){
        const confirmBlock = window.confirm("Are you sure you want to block this user?");
            if (confirmBlock) {
            updateUserStatus(user, "Blocked");
            }
    }
  }

  return (
    <div className="user-management-page">
      <header className="header">
        <h1>{t.header}</h1>
        <button
          className="add-user-button"
          onClick={() => setIsAddUserModalOpen(true)}
        >
          {t.addDealer}
        </button>
      </header>

      <div className="filters">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter}>
          <option value="All">{t.allStatuses}</option>
          <option value="Active">{t.active}</option>
          <option value="Inactive">{t.inactive}</option>
          <option value="Blocked">{t.blocked}</option>
        </select>
      </div>

      <div className="bulk-actions">
        <button className="user-management-button" onClick={() => handleBulkAction("Inactive")}>{t.bulkDeactivate}</button>
        <button className="user-management-button" onClick={() => handleBulkAction("Blocked")}>{t.bulkBlock}</button>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>{t.select}</th>
            <th>{t.name}</th>
            <th>{t.email}</th>
            <th>{t.role}</th>
            <th>{t.status}</th>
            <th>{t.actions}</th>
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
                <button className="user-management-button" onClick={() => handleEditUser(user)}>{t.edit}</button>
                <button className="user-management-button" onClick={() => handleStatusToggle(user)}>
                  {user.status === "Inactive" ? t.activate : t.deactivate}
                </button>
                <button className="user-management-button" onClick={() => handleBlockToggle(user)}>{user.status === "Blocked" ? t.unblock : t.block}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
          <h2>{t.editDealer}</h2>
          <label>{t.name}:</label>
          <input
            type="text"
            value={updatedDetails.name || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <label>{t.email}:</label>
          <input
            type="text"
            value={updatedDetails.email || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <label>{t.phone}:</label>
          <input
            type="text"
            value={updatedDetails.phone || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <label>{t.address}:</label>
          <input
            type="text"
            value={updatedDetails.address || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, address: e.target.value }))
            }
          />
          <label>{t.companyName}:</label>
          <input
            type="text"
            value={updatedDetails.companyName || ""}
            onChange={(e) =>
              setUpdatedDetails((prev) => ({ ...prev, companyName: e.target.value }))
            }
          />
          <button onClick={handleSaveChanges} className="save-button">{t.saveChanges}</button>
          <button onClick={() => setIsModalOpen(false)} className="modal-close">{t.close}</button>
          </div>
        </div>
        
      )}

{isAddUserModalOpen&& (
        <div className="modal">
          <div className="modal-content">
          <h2>{t.addDealer}</h2>
          <label>{t.name}:</label>
          <input
            type="text"
            value={newUserDetails.name}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <label>{t.email}:</label>
          <input
            type="text"
            value={newUserDetails.email}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <label>{t.phone}:</label>
          <input
            type="text"
            value={newUserDetails.phone}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <label>{t.address}:</label>
          <input
            type="text"
            value={newUserDetails.address}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, address: e.target.value }))
            }
          />
          <label>{t.companyName}:</label>
          <input
            type="text"
            value={newUserDetails.companyName}
            onChange={(e) =>
              setNewUserDetails((prev) => ({ ...prev, companyName: e.target.value }))
            }
          />
          <label>{t.role}:</label>
          <input type="text" value="Installer" disabled />
          <button onClick={handleAddUser}>{t.addDealer}</button>
          <button onClick={() => setIsAddUserModalOpen(false)}>{t.close}</button>
        </div>
        </div>
      )}
      
    </div>
  );
};

export default UserManagementPage;
