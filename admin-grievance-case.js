/* =========================================
   LOCAL 41 ADMIN FULL CASE REVIEW
   ========================================= */

let currentAdminProfile = null;
let currentCase = null;

const caseMessage =
  document.getElementById("caseMessage");


/* =========================================
   MESSAGE
   ========================================= */

function showCaseMessage(
  message,
  type = "info"
) {

  if (!caseMessage) return;

  caseMessage.textContent =
    message;

  caseMessage.className =
    "auth-message " + type;

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


  return true;

}


/* =========================================
   LOAD CASE
   ========================================= */

async function loadCase() {

  const verified =
    await verifyAdmin();


  if (!verified) {
    return;
  }


  const params =
    new URLSearchParams(
      window.location.search
    );


  const caseId =
    params.get("id");


  if (!caseId) {

    showCaseMessage(
      "No grievance case was selected.",
      "error"
    );

    document
      .getElementById("casePage")
      .classList
      .remove("admin-hidden");

    return;

  }


  const {
    data: grievance,
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
        incident_time,
        incident_location,
        supervisor_manager,
        classification_job,
        contract_article,
        facts,
        why_violation,
        prior_discussion,
        witnesses,
        evidence_description,
        requested_remedy,
        preferred_contact,
        preferred_rep_id,
        assigned_rep_id,
        created_at,
        updated_at
      `)
      .eq(
        "id",
        caseId
      )
      .single();


  if (
    grievanceError ||
    !grievance
  ) {

    console.error(
      grievanceError
    );


    showCaseMessage(
      "Unable to load this grievance case.",
      "error"
    );


    document
      .getElementById("casePage")
      .classList
      .remove("admin-hidden");

    return;

  }


  currentCase =
    grievance;


/* =========================================
   LOAD MEMBER PROFILE
   ========================================= */

  let member = null;


  if (
    grievance.member_id
  ) {

    const {
      data,
      error
    } =
      await local41Supabase
        .from("profiles")
        .select(
          "id, full_name, email, employee_number, department, shift"
        )
        .eq(
          "id",
          grievance.member_id
        )
        .single();


    if (error) {

      console.error(
        error
      );

    } else {

      member =
        data;

    }

  }


/* =========================================
   LOAD UNION REPS
   ========================================= */

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


  const repMap =
    new Map(
      (reps || []).map(
        rep => [
          rep.profile_id,
          rep
        ]
      )
    );


  const preferredRep =
    grievance.preferred_rep_id
      ? repMap.get(
          grievance.preferred_rep_id
        )
      : null;


  const assignedRep =
    grievance.assigned_rep_id
      ? repMap.get(
          grievance.assigned_rep_id
        )
      : null;


/* =========================================
   RENDER CASE
   ========================================= */

  setText(
    "caseNumber",
    grievance.case_number ||
    "CASE PENDING"
  );


  setText(
    "caseStatus",
    grievance.status ||
    "SUBMITTED"
  );
const statusSelector =
  document.getElementById(
    "caseStatusSelect"
  );

if (statusSelector) {

  statusSelector.value =
    grievance.status ||
    "SUBMITTED";

}
  setText(
    "submittedDate",
    formatDate(
      grievance.created_at
    )
  );


  setText(
    "contractArticle",
    grievance.contract_article ||
    "Union Review"
  );


  setText(
    "caseHero",
    `${grievance.case_number || "Grievance Case"} • ${grievance.status || "SUBMITTED"}`
  );


  setText(
    "memberName",
    member?.full_name ||
    "Unknown Member"
  );


  setText(
    "employeeNumber",
    member?.employee_number ||
    "Not provided"
  );


  setText(
    "memberDepartment",
    member?.department ||
    "Not provided"
  );


  setText(
    "memberShift",
    member?.shift ||
    "Not provided"
  );


  setText(
    "incidentDate",
    formatDateOnly(
      grievance.incident_date
    )
  );


  setText(
    "incidentTime",
    formatTime(
      grievance.incident_time
    )
  );


  setText(
    "incidentLocation",
    grievance.incident_location ||
    "Not provided"
  );


  setText(
    "supervisorManager",
    grievance.supervisor_manager ||
    "Not provided"
  );


  setText(
    "classificationJob",
    grievance.classification_job ||
    "Not provided"
  );


  setText(
    "preferredContact",
    grievance.preferred_contact ||
    "Not provided"
  );


  setText(
    "facts",
    grievance.facts ||
    "Not provided"
  );


  setText(
    "whyViolation",
    grievance.why_violation ||
    "Not provided"
  );


  setText(
    "priorDiscussion",
    grievance.prior_discussion ||
    "Not provided"
  );


  setText(
    "witnesses",
    grievance.witnesses ||
    "None listed"
  );


  setText(
    "evidenceDescription",
    grievance.evidence_description ||
    "None listed"
  );


  setText(
    "requestedRemedy",
    grievance.requested_remedy ||
    "Union to determine"
  );


  setText(
    "preferredRep",
    preferredRep
      ? `${preferredRep.display_name} — ${preferredRep.rep_title}`
      : "No preference"
  );


  setText(
    "assignedRep",
    assignedRep
      ? `${assignedRep.display_name} — ${assignedRep.rep_title}`
      : "Unassigned"
  );


  document
    .getElementById("casePage")
    .classList
    .remove("admin-hidden");

}


/* =========================================
   HELPERS
   ========================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  element.textContent =
    value;

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
        month: "long",
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
        month: "long",
        day: "numeric"
      }
    );

}



function formatTime(
  value
) {

  if (!value) {
    return "Not provided";
  }


  const parts =
    String(value)
      .split(":");


  let hour =
    Number(
      parts[0]
    );


  const minute =
    parts[1] || "00";


  const suffix =
    hour >= 12
      ? "PM"
      : "AM";


  hour =
    hour % 12;


  if (
    hour === 0
  ) {

    hour =
      12;

  }


  return `${hour}:${minute} ${suffix}`;

}

/* =========================================
   UPDATE CASE STATUS
   ========================================= */

async function saveCaseStatus() {

  if (
    !currentCase ||
    !currentAdminProfile
  ) {

    showCaseMessage(
      "Case information is not available.",
      "error"
    );

    return;

  }


  const selector =
    document.getElementById(
      "caseStatusSelect"
    );


  const button =
    document.getElementById(
      "saveStatusButton"
    );


  const newStatus =
    selector.value;


  button.disabled =
    true;


  button.textContent =
    "SAVING...";


  showCaseMessage(
    "Updating case status..."
  );


  const {
    error
  } =
    await local41Supabase
      .from("grievance_requests")
      .update({
        status: newStatus
      })
      .eq(
        "id",
        currentCase.id
      );


  if (error) {

    console.error(
      error
    );


    showCaseMessage(
      "Unable to update the case status.",
      "error"
    );


    button.disabled =
      false;


    button.textContent =
      "SAVE CASE STATUS →";


    return;

  }


  currentCase.status =
    newStatus;


  setText(
    "caseStatus",
    newStatus
  );


  setText(
    "caseHero",
    `${currentCase.case_number || "Grievance Case"} • ${newStatus}`
  );


  showCaseMessage(
    `Case status updated to ${newStatus}.`,
    "success"
  );


  button.disabled =
    false;


  button.textContent =
    "SAVE CASE STATUS ✓";

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
  loadCase
);
