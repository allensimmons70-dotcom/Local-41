/* =========================================
   LOCAL 41 MEMBER DASHBOARD
   ========================================= */


const memberMessage =
  document.getElementById("memberMessage");



/* =========================================
   MESSAGE
   ========================================= */

function showMemberMessage(
  message,
  type = "info"
) {

  if (!memberMessage) return;


  memberMessage.textContent =
    message;


  memberMessage.className =
    "auth-message " + type;

}



/* =========================================
   LOAD MEMBER
   ========================================= */

async function loadMemberDashboard() {


  const {
    data: sessionData,
    error: sessionError
  } =
    await local41Supabase
      .auth
      .getSession();



  if (
    sessionError ||
    !sessionData.session
  ) {

    window.location.href =
      "login.html";

    return;

  }



  const user =
    sessionData.session.user;



  const {
    data: profile,
    error
  } =
    await local41Supabase
      .from("profiles")
      .select(`
  id,
  full_name,
  email,
  employee_number,
  department,
  shift,
  role,
  account_status,
  union_email_updates
`)
      .eq(
        "id",
        user.id
      )
      .single();



  if (
    error ||
    !profile
  ) {

    console.error(error);


    await local41Supabase
      .auth
      .signOut();


    window.location.href =
      "login.html";

    return;

  }



  /* =========================================
     ACCOUNT MUST BE ACTIVE
     ========================================= */

  if (
    profile.account_status !==
    "active"
  ) {

    await local41Supabase
      .auth
      .signOut();


    window.location.href =
      "login.html";

    return;

  }



  /* =========================================
     ADMINS USE ADMIN DASHBOARD
     ========================================= */

  if (
    profile.role === "admin" ||
    profile.role === "lead_admin"
  ) {

    window.location.href =
      "admin.html";

    return;

  }



  /* =========================================
     POPULATE MEMBER PAGE
     ========================================= */

  const fullName =
    profile.full_name ||
    "Local 41 Member";


  const firstName =
    fullName
      .split(" ")[0]
      .toUpperCase();



  document
    .getElementById("memberFirstName")
    .textContent =
      firstName + ".";



  document
    .getElementById("memberName")
    .textContent =
      fullName;



  document
    .getElementById("profileName")
    .textContent =
      fullName;



  document
    .getElementById("profileEmployee")
    .textContent =
      profile.employee_number ||
      "Not provided";



  document
    .getElementById("profileDepartment")
    .textContent =
      profile.department ||
      "Not provided";



  document
    .getElementById("profileShift")
    .textContent =
      profile.shift ||
      "Not provided";



  document
    .getElementById("profileEmail")
    .textContent =
      profile.email ||
      user.email ||
      "Not available";



  document
    .getElementById("memberDashboard")
    .classList
    .remove("admin-hidden");
   
   document
  .getElementById("unionEmailUpdates")
  .checked =
    profile.union_email_updates !== false;
}


async function saveEmailPreference() {

  const checkbox =
    document.getElementById(
      "unionEmailUpdates"
    );


  const receiveUpdates =
    checkbox.checked;


  showMemberMessage(
    "Saving email preference..."
  );


  const {
    error
  } =
    await local41Supabase
      .rpc(
        "update_email_preference",
        {
          receive_updates:
            receiveUpdates
        }
      );


  if (error) {

    console.error(error);


    checkbox.checked =
      !receiveUpdates;


    showMemberMessage(
      "Unable to update email preference.",
      "error"
    );


    return;

  }


  showMemberMessage(

    receiveUpdates
      ? "Email updates are turned on."
      : "Email updates are turned off.",

    "success"

  );

}
/* =========================================
   LOGOUT
   ========================================= */

async function memberLogout() {


  await local41Supabase
    .auth
    .signOut();


  window.location.href =
    "login.html";

}



/* =========================================
   START
   ========================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadMemberDashboard
);
