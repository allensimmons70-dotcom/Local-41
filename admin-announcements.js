/* =========================================
   LOCAL 41 ADMIN ANNOUNCEMENT CENTER
   ========================================= */


let currentAdminProfile = null;


const pageMessage =
  document.getElementById(
    "announcementAdminMessage"
  );


function showMessage(
  message,
  type = "info"
) {

  pageMessage.textContent =
    message;

  pageMessage.className =
    "auth-message " + type;

}


function clearMessage() {

  pageMessage.textContent = "";

  pageMessage.className =
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
        "id, full_name, role, account_status"
      )
      .eq(
        "id",
        user.id
      )
      .single();


  const isAdmin =
    profile?.role === "admin" ||
    profile?.role === "lead_admin";


  if (
    profileError ||
    !profile ||
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
    .getElementById(
      "announcementAdminPage"
    )
    .classList
    .remove("admin-hidden");


  return true;

}



/* =========================================
   DEFAULT PUBLISH TIME
   ========================================= */

function setDefaultPublishTime() {

  const input =
    document.getElementById(
      "publishAt"
    );


  if (input.value) {
    return;
  }


  const now =
    new Date();


  now.setMinutes(
    now.getMinutes() + 1
  );


  input.value =
    toLocalDateTimeInput(now);

}


function toLocalDateTimeInput(
  date
) {

  const pad =
    value =>
      String(value)
        .padStart(2, "0");


  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );

}



/* =========================================
   SAVE ANNOUNCEMENT
   ========================================= */

async function saveAnnouncement(
  event
) {

  event.preventDefault();

  clearMessage();


  if (!currentAdminProfile) {

    showMessage(
      "Administrator verification is required.",
      "error"
    );

    return;

  }


  const title =
    document
      .getElementById(
        "announcementTitle"
      )
      .value
      .trim();


  const message =
    document
      .getElementById(
        "announcementMessage"
      )
      .value
      .trim();


  const category =
    document
      .getElementById(
        "announcementCategory"
      )
      .value;


  const priority =
    document
      .getElementById(
        "announcementPriority"
      )
      .value;


  const publishValue =
    document
      .getElementById(
        "publishAt"
      )
      .value;


  const expiresValue =
    document
      .getElementById(
        "expiresAt"
      )
      .value;


  if (
    !title ||
    !message ||
    !publishValue
  ) {

    showMessage(
      "Complete the title, message and publish time.",
      "error"
    );

    return;

  }


  const publishAt =
    new Date(
      publishValue
    );


  const expiresAt =
    expiresValue
      ? new Date(
          expiresValue
        )
      : null;


  if (
    Number.isNaN(
      publishAt.getTime()
    )
  ) {

    showMessage(
      "The publish date or time is invalid.",
      "error"
    );

    return;

  }


  if (
    expiresAt &&
    expiresAt <= publishAt
  ) {

    showMessage(
      "The removal time must be after the publish time.",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "publishButton"
    );


  button.disabled = true;

  button.textContent =
    "SAVING...";


  const {
    error
  } =
    await local41Supabase
      .from("announcements")
      .insert({

        title,

        message,

        category,

        priority,

        show_on_portal:
          document
            .getElementById(
              "showOnPortal"
            )
            .checked,

        show_on_board:
          document
            .getElementById(
              "showOnBoard"
            )
            .checked,

        send_email:
          document
            .getElementById(
              "sendEmail"
            )
            .checked,

        publish_at:
          publishAt
            .toISOString(),

        expires_at:
          expiresAt
            ? expiresAt
                .toISOString()
            : null,

        created_by:
          currentAdminProfile.id

      });


  button.disabled = false;

  button.textContent =
    "SAVE ANNOUNCEMENT →";


  if (error) {

    console.error(error);

    showMessage(
      "Unable to save the announcement.",
      "error"
    );

    return;

  }


  document
    .getElementById(
      "announcementForm"
    )
    .reset();


  document
    .getElementById(
      "showOnPortal"
    )
    .checked = true;


  document
    .getElementById(
      "showOnBoard"
    )
    .checked = true;


  setDefaultPublishTime();


  showMessage(
    "Announcement saved successfully.",
    "success"
  );


  await loadAnnouncements();

}



/* =========================================
   LOAD ANNOUNCEMENTS
   ========================================= */

async function loadAnnouncements() {

  const list =
    document.getElementById(
      "announcementList"
    );


  list.innerHTML = `
    <div class="admin-loading">
      Loading announcements...
    </div>
  `;


  const {
    data,
    error
  } =
    await local41Supabase
      .from("announcements")
      .select(`
        id,
        title,
        message,
        category,
        priority,
        show_on_portal,
        show_on_board,
        send_email,
        publish_at,
        expires_at,
        email_sent_at,
        created_at
      `)
      .order(
        "publish_at",
        {
          ascending: false
        }
      )
      .limit(50);


  if (error) {

    console.error(error);

    list.innerHTML = "";

    showMessage(
      "Unable to load announcements.",
      "error"
    );

    return;

  }


  renderAnnouncements(
    data || []
  );

}



/* =========================================
   RENDER
   ========================================= */

function renderAnnouncements(
  announcements
) {

  const list =
    document.getElementById(
      "announcementList"
    );


  list.innerHTML = "";


  if (
    !announcements.length
  ) {

    list.innerHTML = `
      <div class="admin-empty">

        <strong>
          NO ANNOUNCEMENTS
        </strong>

        <p>
          Create the first Local 41
          announcement using the form.
        </p>

      </div>
    `;

    return;

  }


  announcements.forEach(
    item => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "announcement-admin-card";


      const status =
        getAnnouncementStatus(
          item
        );


      const destinations = [];


      if (
        item.show_on_portal
      ) {
        destinations.push(
          "MEMBER PORTAL"
        );
      }


      if (
        item.show_on_board
      ) {
        destinations.push(
          "UNION BOARD"
        );
      }


      if (
        item.send_email
      ) {
        destinations.push(
          item.email_sent_at
            ? "EMAIL SENT"
            : "EMAIL QUEUED"
        );
      }


      card.innerHTML = `

        <div class="announcement-admin-meta">

          <span
            class="announcement-chip gold"
          >
            ${escapeHtml(status)}
          </span>

          <span
            class="announcement-chip"
          >
            ${escapeHtml(
              item.category ||
              "GENERAL"
            )}
          </span>

          <span
            class="announcement-chip"
          >
            ${escapeHtml(
              item.priority ||
              "NORMAL"
            )}
          </span>

        </div>


        <h3>
          ${escapeHtml(
            item.title
          )}
        </h3>


        <div
          class="announcement-admin-message"
        >
          ${escapeHtml(
            item.message
          )}
        </div>


        <div class="announcement-destinations">

          ${
            destinations.length
              ? destinations
                  .map(
                    value =>
                      escapeHtml(value)
                  )
                  .join(" • ")
              : "NO DISPLAY CHANNEL SELECTED"
          }

        </div>


        <div class="announcement-admin-dates">

          <div>
            <strong>PUBLISH:</strong>
            ${escapeHtml(
              formatDateTime(
                item.publish_at
              )
            )}
          </div>

          <div>
            <strong>REMOVE:</strong>
            ${
              item.expires_at
                ? escapeHtml(
                    formatDateTime(
                      item.expires_at
                    )
                  )
                : "No expiration"
            }
          </div>

          ${
            item.email_sent_at
              ? `
                <div>
                  <strong>
                    EMAIL SENT:
                  </strong>

                  ${escapeHtml(
                    formatDateTime(
                      item.email_sent_at
                    )
                  )}
                </div>
              `
              : ""
          }

        </div>


        ${
          status !== "EXPIRED" &&
          status !== "CANCELLED"
            ? `

              <button
                class="announcement-cancel"
                type="button"
                onclick="cancelAnnouncement(
                  '${item.id}'
                )"
              >
                CANCEL ANNOUNCEMENT
              </button>

            `
            : ""
        }

      `;


      list.appendChild(
        card
      );

    }
  );

}



/* =========================================
   STATUS
   ========================================= */

function getAnnouncementStatus(
  item
) {

  const now =
    new Date();


  const publishAt =
    new Date(
      item.publish_at
    );


  const expiresAt =
    item.expires_at
      ? new Date(
          item.expires_at
        )
      : null;


  if (
    expiresAt &&
    expiresAt <= now
  ) {

    return "EXPIRED";

  }


  if (
    publishAt > now
  ) {

    return "SCHEDULED";

  }


  return "ACTIVE";

}



/* =========================================
   CANCEL
   ========================================= */

async function cancelAnnouncement(
  announcementId
) {

  const confirmed =
    window.confirm(
      "Cancel this announcement? It will stop displaying and any unsent announcement email will be disabled."
    );


  if (!confirmed) {
    return;
  }


  clearMessage();


  const {
    error
  } =
    await local41Supabase
      .from("announcements")
      .update({

        expires_at:
          new Date()
            .toISOString(),

        send_email:
          false

      })
      .eq(
        "id",
        announcementId
      );


  if (error) {

    console.error(error);

    showMessage(
      "Unable to cancel the announcement.",
      "error"
    );

    return;

  }


  showMessage(
    "Announcement cancelled.",
    "success"
  );


  await loadAnnouncements();

}



/* =========================================
   HELPERS
   ========================================= */

function formatDateTime(
  value
) {

  if (!value) {
    return "—";
  }


  return new Date(
    value
  )
    .toLocaleString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    );

}


function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
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
   LOGOUT
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

async function startAnnouncementCenter() {

  const verified =
    await verifyAdmin();


  if (!verified) {
    return;
  }


  setDefaultPublishTime();

  await loadAnnouncements();

}


document.addEventListener(
  "DOMContentLoaded",
  startAnnouncementCenter
);
