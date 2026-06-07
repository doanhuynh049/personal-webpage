function getSiteConfig() {
  const publicUrl = (process.env.PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const adminUrl = process.env.ADMIN_URL || "/admin";
  return {
    publicUrl,
    adminUrl,
    showAdminLink: process.env.SHOW_ADMIN_LINK !== "0",
  };
}

module.exports = { getSiteConfig };
