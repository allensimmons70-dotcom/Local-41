/* =========================================
   LOCAL 41 ADMIN GRIEVANCE QUEUE
   ========================================= */


let currentAdminProfile = null;

const adminGrievanceMessage =
  document.getElementById(
    "adminGrievanceMessage"
  );


function showAdminGrievanceMessage(
  message,
  type = "info"
) {

  if (!adminGrievanceMessage) {
    return;
  }

  adminGrievanceMessage.textContent =
    message;

  adminGrievanceMessage.className =
    "auth-message " + type;

}


function clearAdminGrievanceMessage() {

  if (!adminGrievanceMessage) {
    return;
  }

  adminGrievanceMessage.textContent = "";

  adminGrievanceMessage.className =
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
      profile.full_name ||
      "Union Administrator";


  document
    .getElementById("adminRole")
    .textContent =
      profile.role === "lead_admin"
        ? "LEAD ADMIN"
        : "ADMIN";


  document
    .getElementById("adminGrievancePage")
    .classList
    .remove("admin-hidden");


  return true;

}


/* =========================================
   LOAD GRIEVANCE QUEUE
   ========================================= */

async function loadAdminGrievances() {

  clearAdminGrievanceMessage();


  const verified =
    await verifyAdmin();


  if (!verified) {
    return;
  }


  const queue =
    document.getElementById(
      "grievanceQueue"
    );


  queue.innerHTML = `

    <div class="admin-loading">
      Loading grievance requests...
    </div>

  `;


  const {
    data: grievances,
    error: grievanceError
  } =
    await local41Supabase
      .from("grievance_requests")
      .select(`
        id,
        case_number,
        member_id,
        status,
        incident_date,
        incident_location,
        classification_job,
        contract_article,
        facts,
        requested_remedy,
        preferred_rep_id,
        assigned_rep_id,
        created_at,
        updated_at
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (grievanceError) {

    console.error(
      grievanceError
    );


    queue.innerHTML = "";


    showAdminGrievanceMessage(
      "Unable to load grievance requests.",
      "error"
    );


    return;

  }


  const cases =
    grievances || [];


  const memberIds =
    [
      ...new Set(
        cases
          .map(
            item =>
              item.member_id
          )
          .filter(Boolean)
      )
    ];


  let memberProfiles = [];


  if (memberIds.length > 0) {

    const {
      data,
      error
    } =
      await local41Supabase
        .from("profiles")
        .select(
          "id, full_name, employee_number, department, shift"
        )
        .in(
          "id",
          memberIds
        );


    if (error) {

      console.error(error);

    } else {

      memberProfiles =
        data || [];

    }

  }


  const {
    data: reps,
    error: repError
  } =
    await local41Supabase
      .from("union_reps")
      .select(
        "profile_id, display_name, rep_title"
      );


  if (repError) {

    console.error(
      repError
    );

  }


  const memberMap =
    new Map(
      memberProfiles.map(
        profile => [
          profile.id,
          profile
        ]
      )
    );


  const repMap =
    new Map(
      (reps || []).map(
        rep => [
          rep.profile_id,
          rep
        ]
      )
    );


  updateSummary(
    cases
  );


  renderGrievanceQueue(
    cases,
    memberMap,
    repMap
  );

}


/* =========================================
   SUMMARY COUNTS
   ========================================= */

function updateSummary(
  cases
) {

  const newCases =
    cases.filter(
      item =>
        item.status ===
        "SUBMITTED"
    );


  const underReview =
    cases.filter(
      item =>
        item.status ===
        "UNDER REVIEW"
    );


  const filed =
    cases.filter(
      item =>
        item.status ===
        "FILED"
    );


  document
    .getElementById(
      "newCaseCount"
    )
    .textContent =
      newCases.length;


  document
    .getElementById(
      "reviewCaseCount"
    )
    .textContent =
      underReview.length;


  document
    .getElementById(
      "filedCaseCount"
    )
    .textContent =
      filed.length;


  document
    .getElementById(
      "totalCaseCount"
    )
    .textContent =
      cases.length;

}


/* =========================================
   RENDER QUEUE
   ========================================= */

function renderGrievanceQueue(
  cases,
  memberMap,
  repMap
) {

  const queue =
    document.getElementById(
      "grievanceQueue"
    );


  queue.innerHTML = "";


  if (
    !cases ||
    cases.length === 0
  ) {

    queue.innerHTML = `

      <div class="admin-empty">

        <strong>
          NO GRIEVANCE REQUESTS
        </strong>

        <p>
          New member grievance requests
          will appear here.
        </p>

      </div>

    `;


    return;

  }


  cases.forEach(
    item => {


      const member =
        memberMap.get(
          item.member_id
        );


      const preferredRep =
        item.preferred_rep_id
          ? repMap.get(
              item.preferred_rep_id
            )
          : null;


      const assignedRep =
        item.assigned_rep_id
          ? repMap.get(
              item.assigned_rep_id
            )
          : null;


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "member-request-card";


      const submittedDate =
        formatDate(
          item.created_at
        );


      const incidentDate =
        formatDateOnly(
          item.incident_date
        );


      card.innerHTML = `

        <div class="request-header">

          <div>

            <span class="request-status">

              ${escapeHtml(
                item.status ||
                "SUBMITTED"
              )}

            </span>


            <h3>

              ${escapeHtml(
                item.case_number ||
                "CASE PENDING"
              )}

            </h3>

          </div>


          <small>

            SUBMITTED
            ${escapeHtml(
              submittedDate
            )}

          </small>

        </div>



        <div class="request-details">


          <div>

            <span>
              MEMBER
            </span>

            <strong>

              ${escapeHtml(
                member?.full_name ||
                "Unknown Member"
              )}

            </strong>

          </div>



          <div>

            <span>
              EMPLOYEE #
            </span>

            <strong>

              ${escapeHtml(
                member?.employee_number ||
                "Not provided"
              )}

            </strong>

          </div>



          <div>

            <span>
              INCIDENT DATE
            </span>

            <strong>

              ${escapeHtml(
                incidentDate
              )}

            </strong>

          </div>



          <div>

            <span>
              CONTRACT
            </span>

            <strong>

              ${escapeHtml(
                item.contract_article ||
                "Union Review"
              )}

            </strong>

          </div>



          <div>

            <span>
              LOCATION
            </span>

            <strong>

              ${escapeHtml(
                item.incident_location ||
                "Not provided"
              )}

            </strong>

          </div>



          <div>

            <span>
              JOB / CLASSIFICATION
            </span>

            <strong>

              ${escapeHtml(
                item.classification_job ||
                "Not provided"
              )}

            </strong>

          </div>



          <div>

            <span>
              PREFERRED REP
            </span>

            <strong>

              ${escapeHtml(
                preferredRep
                  ? preferredRep.display_name
                  : "No preference"
              )}

            </strong>

          </div>



          <div>

            <span>
              ASSIGNED TO
            </span>

            <strong>

              ${escapeHtml(
                assignedRep
                  ? assignedRep.display_name
                  : "Unassigned"
              )}

            </strong>

          </div>


        </div>



        <p class="case-summary">

          <strong>
            MEMBER REPORT
          </strong>

          <br>

          ${escapeHtml(
            truncate(
              item.facts ||
              "",
              400
            )
          )}

        </p>



        ${
          item.requested_remedy
            ? `

              <p class="case-summary">

                <strong>
                  REQUESTED REMEDY
                </strong>

                <br>

                ${escapeHtml(
                  truncate(
                    item.requested_remedy,
                    250
                  )
                )}

              </p>

            `
            : ""
        }



        <div class="request-actions">

  <a
    class="portal-action"
    href="admin-grievance-case.html?id=${encodeURIComponent(item.id)}">

    OPEN FULL CASE →

  </a>

</div>

      `;


      queue.appendChild(
        card
      );

    }
  );

}


/* =========================================
   HELPERS
   ========================================= */

function truncate(
  value,
  max
) {

  const text =
    String(value || "");


  return text.length > max
    ? text.slice(
        0,
        max
      ) + "…"
    : text;

}


function formatDate(
  value
) {

  if (!value) {
    return "Unknown";
  }


  return new Date(
    value
  )
    .toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );

}


function formatDateOnly(
  value
) {

  if (!value) {
    return "Unknown";
  }


  return new Date(
    value +
    "T12:00:00"
  )
    .toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );

}


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
   START
   ========================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadAdminGrievances
);
