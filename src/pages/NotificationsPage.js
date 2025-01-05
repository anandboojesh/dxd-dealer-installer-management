import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { collection, query, where, deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { MdDelete, MdCheckCircle } from "react-icons/md";
import "../styles/components/NotificationsPage.css";
import { useLanguage } from "../context/LanguageContext";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(5);
  const { language } = useLanguage(); 

  const translations = {
    en: {
      title: "Notifications",
      searchPlaceholder: "Search notifications...",
      filterByType: "Filter by Type",
      all: "All",
      info: "Info",
      alert: "Alert",
      reminder: "Reminder",
      markAsRead: "Mark as Read",
      delete: "Delete",
      noNotifications: "No notifications found.",
      loading: "Loading notifications...",
      error: "Failed to fetch notifications. Please try again later.",
    },
    fr: {
      title: "Notifications",
      searchPlaceholder: "Rechercher des notifications...",
      filterByType: "Filtrer par Type",
      all: "Toutes",
      info: "Info",
      alert: "Alerte",
      reminder: "Rappel",
      markAsRead: "Marquer comme lu",
      delete: "Supprimer",
      noNotifications: "Aucune notification trouvée.",
      loading: "Chargement des notifications...",
      error: "Échec du chargement des notifications. Veuillez réessayer.",
    },
  };

  const t = translations[language]; // Helper for translations

  // Fetch notifications on component mount
  useEffect(() => {
    const fetchNotifications = () => {
      if (auth.currentUser) {
        try {
          const notificationsQuery = query(
            collection(db, "Notification"),
            where("userId", "==", auth.currentUser.uid)
          );

          const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const notificationsList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
            }));

            notificationsList.sort((a, b) => b.createdAt - a.createdAt);
            setNotifications(notificationsList);
            setLoading(false);
          });

          return unsubscribe; // Clean up listener on unmount
        } catch (err) {
          console.error("Error fetching notifications:", err);
          setError(t.error);
        }
      }
    };

    const unsubscribe = fetchNotifications();
    return () => unsubscribe && unsubscribe(); // Cleanup for real-time listener
  }, []);

  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      const notificationRef = doc(db, "Notification", id);
      await updateDoc(notificationRef, { read: "true" });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Delete a notification
  const deleteNotification = async (id) => {
    try {
      const notificationRef = doc(db, "Notification", id);
      await deleteDoc(notificationRef);
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Filter and search functionality
  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter = filter === "all" || notification.type === filter;
    const matchesSearch = notification.message
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + notificationsPerPage
  );

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  // Group notifications by date
  const groupedNotifications = currentNotifications.reduce((groups, notification) => {
    const date = notification.createdAt ? notification.createdAt.toDateString() : "No Date";
    if (!groups[date]) groups[date] = [];
    groups[date].push(notification);
    return groups;
  }, {});

  if (loading) return <p>{t.loading}</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="notifications-container">
      <h1>{t.title}</h1>

      {/* Search and Filter */}
      <div className="filter-container">
        <label htmlFor="search">Search: </label>
        <input
          id="search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
        />
        <label htmlFor="filter">{t.filterByType}: </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">{t.all}</option>
          <option value="info">{t.info}</option>
          <option value="alert">{t.alert}</option>
          <option value="reminder">{t.reminder}</option>
        </select>
      </div>

      {/* Grouped Notifications */}
      {Object.keys(groupedNotifications).length > 0 ? (
        Object.keys(groupedNotifications).map((date) => (
          <div key={date} className="notification-group">
            <h2>{date}</h2>
            <ul>
              {groupedNotifications[date].map((notification) => (
                <li
                  key={notification.id}
                  className={notification.read ? "read" : "unread"}
                >
                  <p>{notification.message}</p>
                  {notification.createdAt && (
                    <small>{notification.createdAt.toLocaleString()}</small>
                  )}
                  <div className="notification-actions">
                    {notification.read === "false" && (
                      <button onClick={() => markAsRead(notification.id)}>
                        <MdCheckCircle /> {t.markAsRead}
                      </button>
                    )}
                    <button onClick={() => deleteNotification(notification.id)}>
                      <MdDelete /> {t.delete}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>{t.noNotifications}</p>
      )}

      {/* Pagination */}
      <div className="pagination1">
        <button onClick={() => handlePageChange(currentPage - 1)}>&lt;</button>
        {[...Array(totalPages).keys()].map((page) => (
          <button
            key={page + 1}
            onClick={() => handlePageChange(page + 1)}
            className={currentPage === page + 1 ? "active" : ""}
          >
            {page + 1}
          </button>
        ))}
        <button onClick={() => handlePageChange(currentPage + 1)}>&gt;</button>
      </div>
    </div>
  );
};

export default NotificationsPage;
