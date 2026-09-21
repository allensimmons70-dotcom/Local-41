/* =========================================
   LOCAL 41 MEMBER AUTHENTICATION
   ========================================= */


const loginMessage =
  document.getElementById("authMessage");



/* =========================================
   DISPLAY MESSAGE
   ========================================= */

function showAuthMessage(
  message,
  type = "info"
) {

  if (!loginMessage) return;


  loginMessage.textContent =
    message;


  loginMessage.className =
    "auth-message " + type;

}



/* =========================================
   REQUEST MEMBER ACCESS
   ========================================= */

async function requestAccess(event) {

  event.preventDefault();


  const fullName =
    document
      .getElementById("registerName")
      .value
      .trim();


  const employeeNumber =
    document
      .getElementById("registerEmployee")
      .value
      .trim();


  const department =
    document
      .getElementById("registerDepartment")
      .value
      .trim();


  const shift =
    document
      .getElementById("registerShift")
      .value
      .trim();


  const email =
    document
      .getElementById("registerEmail")
      .value
      .trim();


  const password =
    document
      .getElementById("registerPassword")
      .value;


  const confirmPassword =
    document
      .getElementById("registerConfirmPassword")
      .value;



  if (password.length < 8) {

    showAuthMessage(
      "Password must contain at least 8 characters.",
      "error"
    );

    return;

  }



  if (password !== confirmPassword) {

    showAuthMessage(
      "Passwords do not match.",
      "error"
    );

    return;

  }



  showAuthMessage(
    "Submitting access request..."
  );



  const {
    data,
    error
  } = await local41Supabase.auth.signUp({

    email,

    password,

    options: {

      emailRedirectTo:
        "https://local41kc.online/login.html",

      data: {

        full_name:
          fullName,

        employee_number:
          employeeNumber,

        department:
          department,

        shift:
          shift

      }

    }

  });



  if (error) {

    showAuthMessage(
      error.message,
      "error"
    );

    return;

  }



  showAuthMessage(
    "Access request received. Check your email to verify your address. After verification, a Local 41 administrator must approve your account before member access is activated.",
    "success"
  );


  document
    .getElementById("registerForm")
    .reset();

}



/* =========================================
   MEMBER LOGIN
   ========================================= */

async function memberLogin(event) {

  event.preventDefault();


  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim();


  const password =
    document
      .getElementById("loginPassword")
      .value;



  showAuthMessage(
    "Signing in..."
  );



  const {
    data,
    error
  } =
    await local41Supabase
      .auth
      .signInWithPassword({

        email,

        password

      });



  if (error) {

    showAuthMessage(
      "Unable to sign in. Check your email and password.",
      "error"
    );

    return;

  }



  const user =
    data.user;



  if (!user) {

    showAuthMessage(
      "Unable to verify account.",
      "error"
    );

    return;

  }



  const {
    data: profile,
    error: profileError
  } =
    await local41Supabase
      .from("profiles")
      .select(
        "full_name, role, account_status"
      )
      .eq(
        "id",
        user.id
      )
      .single();



  if (
    profileError ||
    !profile
  ) {

    await local41Supabase
      .auth
      .signOut();


    showAuthMessage(
      "Your member profile could not be verified.",
      "error"
    );

    return;

  }



  if (
    profile.account_status ===
    "pending"
  ) {

    await local41Supabase
      .auth
      .signOut();


    showAuthMessage(
      "Your email is verified, but your Local 41 membership is still awaiting administrator approval.",
      "warning"
    );

    return;

  }



  if (
    profile.account_status ===
    "denied"
  ) {

    await local41Supabase
      .auth
      .signOut();


    showAuthMessage(
      "This access request was not approved. Contact Local 41 representation if you believe this is an error.",
      "error"
    );

    return;

  }



  if (
    profile.account_status ===
    "suspended"
  ) {

    await local41Supabase
      .auth
      .signOut();


    showAuthMessage(
      "This account is currently unavailable. Contact Local 41 representation.",
      "error"
    );

    return;

  }



  if (
    profile.account_status !==
    "active"
  ) {

    await local41Supabase
      .auth
      .signOut();


    showAuthMessage(
      "This account does not currently have member access.",
      "error"
    );

    return;

  }



  /*
    ACTIVE ACCOUNT
  */


  if (
    profile.role === "admin" ||
    profile.role === "lead_admin"
  ) {

    window.location.href =
      "admin.html";

  }

  else {

    window.location.href =
      "member.html";

  }

}



/* =========================================
   PASSWORD RESET
   ========================================= */

async function resetPassword() {

  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim();



  if (!email) {

    showAuthMessage(
      "Enter your email address first, then choose Forgot Password.",
      "warning"
    );

    return;

  }



  const {
    error
  } =
    await local41Supabase
      .auth
      .resetPasswordForEmail(
        email,
        {
          redirectTo:
            "https://local41kc.online/reset-password.html"
        }
      );



  if (error) {

    showAuthMessage(
      error.message,
      "error"
    );

    return;

  }



  showAuthMessage(
    "Password reset instructions have been sent to your email.",
    "success"
  );

}



/* =========================================
   CHECK EXISTING SESSION
   ========================================= */

async function checkExistingLogin() {

  const {
    data
  } =
    await local41Supabase
      .auth
      .getSession();



  if (
    !data.session
  ) {

    return;

  }



  const user =
    data.session.user;



  const {
    data: profile
  } =
    await local41Supabase
      .from("profiles")
      .select(
        "role, account_status"
      )
      .eq(
        "id",
        user.id
      )
      .single();



  if (
    !profile ||
    profile.account_status !==
    "active"
  ) {

    return;

  }



  if (
    profile.role === "admin" ||
    profile.role === "lead_admin"
  ) {

    window.location.href =
      "admin.html";

  }

  else {

    window.location.href =
      "member.html";

  }

}



/* =========================================
   RUN ON LOGIN PAGE
   ========================================= */

document.addEventListener(
  "DOMContentLoaded",
  checkExistingLogin
);
