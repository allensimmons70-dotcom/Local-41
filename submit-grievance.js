let currentMember = null;

const pageMessage =
  document.getElementById("pageMessage");


function showPageMessage(message, type = "info") {

  if (!pageMessage) return;

  pageMessage.textContent = message;

  pageMessage.className =
    "auth-message " + type;
}



async function verifyMember() {

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
    error
  } =
    await local41Supabase
      .from("profiles")
      .select(
        "id, full_name, email, employee_number, department, shift, role, account_status"
      )
      .eq(
        "id",
        user.id
      )
      .single();


  if (
    error ||
    !profile ||
    profile.account_status !== "active"
  ) {

    await local41Supabase
      .auth
      .signOut();

    window.location.href =
      "login.html";

    return false;

  }


  if (
    profile.role === "admin" ||
    profile.role === "lead_admin"
  ) {

    window.location.href =
      "admin.html";

    return false;

  }


  currentMember =
    profile;


  document
    .getElementById("memberDisplayName")
    .textContent =
      profile.full_name ||
      "Local 41 Member";


  document
    .getElementById("memberDisplayDetails")
    .textContent =
      `Employee # ${profile.employee_number || "—"} • ${profile.department || "Department not listed"} • ${profile.shift || "Shift not listed"}`;


  document
    .getElementById("protectedPage")
    .classList
    .remove("admin-hidden");


  await loadUnionReps();


  return true;

}



async function loadUnionReps() {

  const selector =
    document.getElementById(
      "preferredRep"
    );


  if (!selector) {
    return;
  }


  const {
    data: reps,
    error
  } =
    await local41Supabase
      .from("union_reps")
      .select(
        "profile_id, display_name, rep_title, accepting_cases, is_visible, sort_order"
      )
      .eq(
        "is_visible",
        true
      )
      .eq(
        "accepting_cases",
        true
      )
      .order(
        "sort_order",
        {
          ascending: true
        }
      )
      .order(
        "display_name",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    return;

  }


  (reps || []).forEach(
    rep => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        rep.profile_id;


      option.textContent =
        `${rep.display_name} — ${rep.rep_title}`;


      selector.appendChild(
        option
      );

    }
  );

}



function updateDeadlineNotice() {

  const input =
    document.getElementById(
      "incidentDate"
    );


  const box =
    document.getElementById(
      "deadlineNotice"
    );


  if (!input.value) {

    box.className =
      "deadline-box";


    box.textContent =
      "Select the incident date to see the 14-calendar-day Article 12 timing reminder.";

    return;

  }


  const incident =
    new Date(
      input.value +
      "T12:00:00"
    );


  const deadline =
    new Date(
      incident
    );


  deadline.setDate(
    deadline.getDate() + 14
  );


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  const deadlineDay =
    new Date(
      deadline
    );


  deadlineDay.setHours(
    0,
    0,
    0,
    0
  );


  const daysRemaining =
    Math.ceil(
      (
        deadlineDay.getTime() -
        today.getTime()
      ) /
      86400000
    );


  const formatted =
    deadline.toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    );


  if (daysRemaining < 0) {

    box.className =
      "deadline-box danger";


    box.textContent =
      `Article 12 timing reminder: 14 calendar days from the incident date is ${formatted}. That date has passed. Submit the request anyway so the Union can review timeliness and any relevant facts.`;

  }

  else if (daysRemaining <= 3) {

    box.className =
      "deadline-box warning";


    box.textContent =
      `URGENT: 14 calendar days from the incident date is ${formatted}. Only ${daysRemaining} day(s) remain based on the date entered.`;

  }

  else {

    box.className =
      "deadline-box";


    box.textContent =
      `Article 12 timing reminder: 14 calendar days from the incident date is ${formatted}. Submit as soon as possible; the Union will determine the actual contractual deadline.`;

  }

}



async function submitGrievance(event) {

  event.preventDefault();


  if (!currentMember) {

    showPageMessage(
      "Member session could not be verified.",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "submitButton"
    );


  button.disabled =
    true;


  button.textContent =
    "SUBMITTING...";


  showPageMessage(
    "Submitting grievance request..."
  );


  const preferredRepValue =
    document
      .getElementById("preferredRep")
      .value;


  const payload = {

    member_id:
      currentMember.id,

    incident_date:
      document
        .getElementById("incidentDate")
        .value,

    incident_time:
      document
        .getElementById("incidentTime")
        .value || null,

    incident_location:
      document
        .getElementById("incidentLocation")
        .value
        .trim() || null,

    supervisor_manager:
      document
        .getElementById("supervisorManager")
        .value
        .trim() || null,

    classification_job:
      document
        .getElementById("classificationJob")
        .value
        .trim() || null,

    contract_article:
      document
        .getElementById("contractArticle")
        .value,

    facts:
      document
        .getElementById("facts")
        .value
        .trim(),

    why_violation:
      document
        .getElementById("whyViolation")
        .value
        .trim() || null,

    prior_discussion:
      document
        .getElementById("priorDiscussion")
        .value
        .trim() || null,

    witnesses:
      document
        .getElementById("witnesses")
        .value
        .trim() || null,

    evidence_description:
      document
        .getElementById("evidenceDescription")
        .value
        .trim() || null,

    requested_remedy:
      document
        .getElementById("requestedRemedy")
        .value
        .trim() || null,

    preferred_contact:
      document
        .getElementById("preferredContact")
        .value
        .trim() || null,

    preferred_rep_id:
      preferredRepValue || null

  };


  const {
    data,
    error
  } =
    await local41Supabase
      .from("grievance_requests")
      .insert(payload)
      .select(
        "id, case_number"
      )
      .single();


  if (error) {

    console.error(error);


    showPageMessage(
      "Unable to submit the grievance request. Your information was not saved. Please try again or contact a Union representative.",
      "error"
    );


    button.disabled =
      false;


    button.textContent =
      "SUBMIT GRIEVANCE REQUEST →";


    return;

  }


  showPageMessage(
    `Grievance request submitted successfully. Your case number is ${data.case_number}.`,
    "success"
  );


  document
    .getElementById("grievanceForm")
    .reset();


  updateDeadlineNotice();


  button.textContent =
    "SUBMITTED ✓";


  setTimeout(
    () => {

      window.location.href =
        "my-grievances.html";

    },
    1800
  );

}



async function memberLogout() {

  await local41Supabase
    .auth
    .signOut();


  window.location.href =
    "login.html";

}



document.addEventListener(
  "DOMContentLoaded",
  verifyMember
);
