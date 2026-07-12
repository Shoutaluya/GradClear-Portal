const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

process.env.GOOGLE_CLOUD_PROJECT = "gen-lang-client-0095822000";

initializeApp({
  credential: applicationDefault(),
  projectId: "gen-lang-client-0095822000"
});

async function run() {
  try {
    const user = await getAuth().getUserByEmail("aghoghoaluya@gmail.com");
    await getAuth().deleteUser(user.uid);
    console.log("User deleted successfully.");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
