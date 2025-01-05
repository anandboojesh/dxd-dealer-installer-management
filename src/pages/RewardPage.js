import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "../styles/components/rewardsPage.css";
import { useLanguage } from "../context/LanguageContext";

const RewardsPage = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date");
  const { language } = useLanguage(); 

  const translations = {
    en: {
      rewards: "Your Rewards",
      searchPlaceholder: "Search rewards...",
      sortByDate: "Sort by Date",
      sortByStatus: "Sort by Status",
      loading: "Loading rewards...",
      error: "Failed to load rewards. Please try again.",
      noRewards: "No rewards available at the moment.",
      status: "Status",
      couponCode: "Coupon Code",
      date: "Date",
      redeemButton: "Redeem Now",
      redeemComingSoon: "Redeem functionality coming soon!",
    },
    fr: {
      rewards: "Vos Récompenses",
      searchPlaceholder: "Rechercher des récompenses...",
      sortByDate: "Trier par Date",
      sortByStatus: "Trier par Statut",
      loading: "Chargement des récompenses...",
      error: "Échec du chargement des récompenses. Veuillez réessayer.",
      noRewards: "Aucune récompense disponible pour le moment.",
      status: "Statut",
      couponCode: "Code de Coupon",
      date: "Date",
      redeemButton: "Échanger Maintenant",
      redeemComingSoon: "Fonctionnalité d'échange à venir !",
    }
  };
  


  const t = translations[language]; // Helper for translations

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setError(null);
    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const q = query(collection(db, "Rewards"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const rewardsList = querySnapshot.docs.map((doc) => doc.data());
        setRewards(rewardsList);
      } else {
        setRewards([]);
      }
    } catch (err) {
      console.error("Error fetching rewards:", err.message);
      setError("Failed to load rewards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  const sortedRewards = [...rewards].sort((a, b) => {
    if (sortOption === "date") {
      return new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000);
    } else if (sortOption === "status") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const filteredRewards = sortedRewards.filter((reward) =>
    reward.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rewards-page">
      <h2>{t.rewards}</h2>

      {/* Search and Sort Options */}
      <div className="filters">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={handleSearch}
        />

        <select value={sortOption} onChange={handleSortChange}>
          <option value="date">{t.sortByDate}</option>
          <option value="status">{t.sortByStatus}</option>
        </select>
      </div>

      {loading ? (
        <p>{t.loading}</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : filteredRewards.length === 0 ? (
        <div className="empty-state">
          <p>{t.noRewards}</p>
          <img
            src="/path/to/empty-state-illustration.png"
            alt="No Rewards"
          />
        </div>
      ) : (
        <div className="rewards-list">
          {filteredRewards.map((reward, index) => (
            <div key={index} className="reward-item">
              <h4>{reward.message}</h4>
              <p>
                <strong>{t.status}:</strong>{" "}
                <span
                  className={`status ${reward.status.toLowerCase()}`}
                >
                  {reward.status}
                </span>
              </p>
              <p>
                <strong>{t.couponCode}:</strong> {reward.couponNumber}
              </p>
              <p>
                <strong>{t.date}:</strong>{" "}
                {new Date(reward.createdAt.seconds * 1000).toLocaleDateString()}
              </p>
              <button onClick={() => alert("Redeem functionality coming soon!")}>
                {t.redeemButton}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RewardsPage;
