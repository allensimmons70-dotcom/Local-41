/* =========================================
   LOCAL 41 ADMIN DASHBOARD
   ========================================= */


const adminMessage =
  document.getElementById("adminMessage");


let currentAdminProfile = null;



/* =========================================
   MESSAGE
   ========================================= */

function showAdminMessage(
  message,
  type = "info"
) {

  if (!adminMessage) return;


  adminMessage.textContent =
    message;


  adminMessage.className =
    "auth-message " + type;

}



function clearAdminMessage() {

  if (!adminMessage) return;


  adminMessage.textContent = "";

  adminMessage.className =
    "auth-message";

}



/* =========================================
   VERIFY ADMIN
   ========================================= */

async function verifyAdmin() {


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

    return false;

  }



  const user =
    sessionData.session.user;



  const {
    data: profile,
    error: profileError
  } =
    await local41Supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, account_status"
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


    window.location.href =
      "login.html";

    return false;

  }



  const isAdmin =
    profile.role === "admin" ||
    profile.role === "lead_admin";



  if (
    profile.account_status !== "active" ||
    !isAdmin
  ) {

    window.location.href =
      "member.html";

    return false;

  }



  currentAdminProfile =
    profile;



  document
    .getElementById("adminName")
    .textContent =
      profile.full_name;



  document
    .getElementById("adminRole")
    .textContent =
      profile.role === "lead_admin"
        ? "LEAD ADMIN"
        : "ADMIN";



  document
    .getElementById("adminDashboard")
    .classList
    .remove("admin-hidden");


  return true;

}



/* =========================================
   LOAD DASHBOARD
   ========================================= */

async function loadAdminDashboard() {


  clearAdminMessage();


  const verified =
    await verifyAdmin();


  if (!verified) {
    return;
  }



  const {
    data: profiles,
    error
  } =
    await local41Supabase
      .from("profiles")
      .select(
        "id, full_name, email, employee_number, department, shift, role, account_status, created_at"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );



  if (error) {

    console.error(error);


    showAdminMessage(
      "Unable to load member records.",
      "error"
    );


    return;

  }



  const allProfiles =
    profiles || [];



  const pending =
    allProfiles.filter(
      profile =>
        profile.account_status ===
        "pending"
    );



  const active =
    allProfiles.filter(
      profile =>
        profile.account_status ===
        "active"
    );



  const denied =
    allProfiles.filter(
      profile =>
        profile.account_status ===
        "denied"
    );



  document
    .getElementById("pendingCount")
    .textContent =
      pending.length;



  document
    .getElementById("activeCount")
    .textContent =
      active.length;



  document
    .getElementById("deniedCount")
    .textContent =
      denied.length;



  document
    .getElementById("totalCount")
    .textContent =
      allProfiles.length;



  renderPendingMembers(
    pending
  );

}



/* =========================================
   RENDER PENDING MEMBERS
   ========================================= */

function renderPendingMembers(
  members
) {


  const container =
    document.getElementById(
      "pendingMembers"
    );



  if (!container) {
    return;
  }



  container.innerHTML = "";



  if (
    !members ||
    members.length === 0
  ) {

    container.innerHTML = `

      <div class="admin-empty">

        <strong>
          NO PENDING REQUESTS
        </strong>

        <p>
          New member access requests
          will appear here.
        </p>

      </div>

    `;


    return;

  }



  members.forEach(
    member => {


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "member-request-card";



      const requestedDate =
        member.created_at
          ? new Date(
              member.created_at
            ).toLocaleDateString(
              undefined,
              {
                year: "numeric",
                month: "short",
                day: "numeric"
              }
            )
          : "Unknown";



      card.innerHTML = `

        <div class="request-header">

          <div>

            <span class="request-status">
              PENDING APPROVAL
            </span>

            <h3>
              ${escapeHtml(
                member.full_name ||
                "Unnamed Member"
              )}
            </h3>

          </div>


          <small>
            REQUESTED
            ${escapeHtml(
              requestedDate
            )}
          </small>

        </div>



        <div class="request-details">


          <div>

            <span>
              EMPLOYEE #
            </span>

            <strong>
              ${escapeHtml(
                member.employee_number ||
                "Not provided"
              )}
            </strong>

          </div>



          <div>

            <span>
              DEPARTMENT
            </span>

            <strong>
              ${escapeHtml(
                member.department ||
                "Not provided"
              )}
            </strong>

          </div>



          <div>

            <span>
              SHIFT
            </span>

            <strong>
              ${escapeHtml(
                member.shift ||
                "Not provided"
              )}
            </strong>

          </div>



          <div>

            <span>
              EMAIL
            </span>

            <strong>
              ${escapeHtml(
                member.email ||
                "Not available"
              )}
            </strong>

          </div>


        </div>



        <div class="request-actions">


          <button
            class="approve-button"
            onclick="
              reviewMember(
                '${member.id}',
                'active',
                '${escapeForAttribute(
                  member.full_name ||
                  "this member"
                )}'
              )
            ">

            APPROVE MEMBER

          </button>



          <button
            class="deny-button"
            onclick="
              reviewMember(
                '${member.id}',
                'denied',
                '${escapeForAttribute(
                  member.full_name ||
                  "this member"
                )}'
              )
            ">

            DENY REQUEST

          </button>


        </div>

      `;



      container.appendChild(
        card
      );

    }
  );

}



/* =========================================
   APPROVE / DENY MEMBER
   ========================================= */

async function reviewMember(
  memberId,
  newStatus,
  memberName
) {


  const action =
    newStatus === "active"
      ? "approve"
      : "deny";



  const confirmed =
    window.confirm(

      `Are you sure you want to ${action} ${memberName}?`

    );



  if (!confirmed) {
    return;
  }



  showAdminMessage(
    newStatus === "active"
      ? `Approving ${memberName}...`
      : `Denying ${memberName}...`
  );



  const {
    error
  } =
    await local41Supabase
      .rpc(
        "review_member_access",
        {

          target_user:
            memberId,

          new_status:
            newStatus

        }
      );



  if (error) {

    console.error(error);


    showAdminMessage(
      error.message ||
      "Unable to update member access.",
      "error"
    );


    return;

  }



  showAdminMessage(

    newStatus === "active"

      ? `${memberName} has been approved for member access.`

      : `${memberName}'s access request has been denied.`,

    "success"

  );



  await loadAdminDashboard();

}



/* =========================================
   LOG OUT
   ========================================= */

async function adminLogout() {


  await local41Supabase
    .auth
    .signOut();


  window.location.href =
    "login.html";

}



/* =========================================
   SAFE HTML OUTPUT
   ========================================= */

function escapeHtml(
  value
) {


  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}



function escapeForAttribute(
  value
) {


  return String(value)
    .replaceAll(
      "\\",
      "\\\\"
    )
    .replaceAll(
      "'",
      "\\'"
    )
    .replaceAll(
      '"',
      "&quot;"
    );

}



/* =========================================
   START DASHBOARD
   ========================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadAdminDashboard
);
