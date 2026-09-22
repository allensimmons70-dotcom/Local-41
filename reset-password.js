/* =========================================
   LOCAL 41 PASSWORD RESET
   ========================================= */


const resetMessage =
  document.getElementById("resetMessage");



function showResetMessage(
  message,
  type = "info"
) {

  if (!resetMessage) return;


  resetMessage.textContent =
    message;


  resetMessage.className =
    "auth-message " + type;

}



/* =========================================
   UPDATE PASSWORD
   ========================================= */

async function updatePassword(event) {

  event.preventDefault();


  const password =
    document
      .getElementById("newPassword")
      .value;


  const confirmPassword =
    document
      .getElementById("confirmNewPassword")
      .value;



  if (password.length < 8) {

    showResetMessage(
      "Password must contain at least 8 characters.",
      "error"
    );

    return;

  }



  if (password !== confirmPassword) {

    showResetMessage(
      "Passwords do not match.",
      "error"
    );

    return;

  }



  showResetMessage(
    "Updating password..."
  );



  const {
    data: sessionData
  } =
    await local41Supabase
      .auth
      .getSession();



  if (!sessionData.session) {

    showResetMessage(
      "This password reset link is invalid or has expired. Return to Member Login and request a new password reset email.",
      "error"
    );

    return;

  }



  const {
    error
  } =
    await local41Supabase
      .auth
      .updateUser({

        password:
          password

      });



  if (error) {

    showResetMessage(
      error.message,
      "error"
    );

    return;

  }



  showResetMessage(
    "Password updated successfully. Redirecting to Member Login...",
    "success"
  );



  setTimeout(
    async () => {

      await local41Supabase
        .auth
        .signOut();


      window.location.href =
        "login.html";

    },
    1800
  );

}
