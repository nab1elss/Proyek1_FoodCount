import {
  getValue,
  onInput,
} from "https://cdn.jsdelivr.net/gh/jscroot/element@0.1.7/croot.js";
import { validatePhoneNumber } from "https://cdn.jsdelivr.net/gh/jscroot/validate@0.0.1/croot.js";
import { postJSON } from "https://cdn.jsdelivr.net/gh/jscroot/api@0.0.7/croot.js";
import { deleteJSON } from "https://cdn.jsdelivr.net/gh/jscroot/api@0.0.8/croot.js";
import { getJSON } from "https://cdn.jsdelivr.net/gh/jscroot/api@0.0.7/croot.js";
import { getCookie } from "https://cdn.jsdelivr.net/gh/jscroot/cookie@0.0.1/croot.js";
import { addCSSIn } from "https://cdn.jsdelivr.net/gh/jscroot/element@0.1.5/croot.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/src/sweetalert2.js";
import { id, backend } from "/dashboard/jscroot/url/config.js";
import { loadScript } from "../../../controller/main.js";
import { truncateText, addRevealTextListeners } from "../../utils.js";

let dataTable;

export async function main() {
  await addCSSIn(
    "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.css",
    id.content
  );
  await addCSSIn("assets/css/custom.css", id.content);
  await loadScript("https://code.jquery.com/jquery-3.6.0.min.js");
  await loadScript("https://cdn.datatables.net/2.0.8/js/dataTables.min.js");

  getJSON(
    backend.project.data,
    "login",
    getCookie("login"),
    getResponseFunction,
  );
}

function reloadDataTable() {
  if (dataTable) {
    dataTable.destroy(); // Destroy the existing DataTable
  }
  getJSON(
    backend.project.data,
    "login",
    getCookie("login"),
    getResponseFunction
  );
}

function getResponseFunction(result) {
  console.log(result);
  const tableBody = document.getElementById("webhook-table-body");
  if (tableBody) {
    if (result.status === 200) {
      // Clear existing table body content to avoid duplication
      tableBody.innerHTML = "";

      // Destroy existing DataTable instance if it exists
      if ($.fn.DataTable.isDataTable("#myTable")) {
        $("#myTable").DataTable().destroy();
      }

      // Menambahkan baris untuk setiap webhook dalam data JSON
      result.data.forEach((project) => {
        const truncatedDescription = truncateText(project.description, 50);

        // Gabungkan nama anggota dalam satu kolom dengan numbering dan tambahkan tombol Add Member
        let membersHtml = "";
        if (project.members && project.members.length > 0) {
          membersHtml = project.members
            .map(
              (member, index) =>
                `
                  <div class="tag is-success mb-3">
                     ${index + 1}. ${member.name}
                    <button class="delete is-small removeMemberButton" data-project-name="${
                      project.name
                    }" data-member-phonenumber="${member.phonenumber}"></button>
                  </div>
                `
            )
            .join("");
        }
        membersHtml += `
          <button class="button box is-primary is-small btn-flex addMemberButton" data-project-id="${project._id}">
            <i class="bx bx-plus"></i>
            Add member
          </button>`;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${project.name}</td>
          <td>${membersHtml}</td>
          <td class="has-text-justified">
            ${truncatedDescription}
            <span class="full-text" style="display:none;">${project.description}</span>
          </td>
        `;
        tableBody.appendChild(row);
      });

      // Initialize DataTable after populating the table body
      dataTable = $("#myTable").DataTable({
        responsive: true,
        autoWidth: false,
      });

      addRevealTextListeners();
      addMemberButtonListeners(); //  event listener tambah member
      addRemoveMemberButtonListeners(); //  event listener hapus member
    } else {
      Swal.fire({
        icon: "error",
        title: result.data.status,
        text: result.data.response,
      });
    }
  } else {
    console.error('Element with ID "webhook-table-body" not found.');
  }
}


// Function to add event listeners to addMemberButtons
function addMemberButtonListeners() {
  document.querySelectorAll(".addMemberButton").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const projectId = button.getAttribute("data-project-id");
      const projectName =
        button.getAttribute("data-project-name") ||
        button.closest("tr").querySelector("td:first-child").innerText;
      const { value: formValues } = await Swal.fire({
        title: "Tambah Member",
        html: `
          <div class="field">
            <div class="control">
              <label class="label">Nama Project</label>
              <input type="hidden" id="project-id" name="projectId" value="${projectId}">
              <input class="input" type="text" value="${projectName}" disabled>
            </div>
          </div>
          <div class="field">
            <label class="label">Nomor Telepon Calon Member</label>
            <div class="control">
              <input class="input" type="tel" id="phonenumber" name="phonenumber" placeholder="628111" required>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Tambah Member",
        preConfirm: () => {
          const phoneNumber = document.getElementById("phonenumber").value;
          const projectId = document.getElementById("project-id").value;
          if (!phoneNumber) {
            Swal.showValidationMessage(`Please enter a phone number`);
          }
          return { phoneNumber, projectId };
        },
      });

      if (formValues) {
        const { phoneNumber, projectId } = formValues;
        // Logic to add member
        onInput("phonenumber", validatePhoneNumber);
        let idprjusr = {
          _id: projectId,
          phonenumber: phoneNumber,
        };
        postJSON(
          backend.project.anggota,
          "login",
          getCookie("login"),
          idprjusr,
          postResponseFunction
        );
      }
    });
  });
}

// Add project event listener
document.getElementById("addButton").addEventListener("click", () => {
  Swal.fire({
    title: "Add New Project",
    html: `
            <div class="field">
                <label class="label">Project Name</label>
                <div class="control">
                    <input class="input" type="text" id="name" placeholder="huruf kecil tanpa spasi boleh pakai - dan _">
                </div>
            </div>
            <div class="field">
                <label class="label">WhatsApp Group ID</label>
                <div class="control">
                    <input class="input" type="text" id="wagroupid" placeholder="minta group id ke bot">
                </div>
            </div>
            <div class="field">
                <label class="label">Description</label>
                <div class="control">
                    <textarea class="textarea" id="description" placeholder="Tulis deskripsi proyek Kakak"></textarea>
                </div>
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      const name = Swal.getPopup().querySelector("#name").value;
      const wagroupid = Swal.getPopup().querySelector("#wagroupid").value;
      const description = Swal.getPopup().querySelector("#description").value;
      if (!name || !wagroupid || !description) {
        Swal.showValidationMessage(`Please enter all fields`);
      }
      return { name: name, wagroupid: wagroupid, description: description };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      let result = {
        name: getValue("name"),
        wagroupid: getValue("wagroupid"),
        description: getValue("description"),
      };
      if (getCookie("login") === "") {
        redirect("/signin");
      } else {
        postJSON(
          backend.project.data,
          "login",
          getCookie("login"),
          result,
          responseFunction
        );
      }
    }
  });
});

function responseFunction(result) {
  if (result.status === 200) {
    const katakata = "Pembuatan proyek baru " + result.data._id;
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text:
        "Selamat kak proyek " +
        result.data.name +
        " sudah terdaftar dengan ID: " +
        result.data._id +
        " dan Secret: " +
        result.data.secret,
      footer:
        '<a href="https://wa.me/62895601060000?text=' +
        katakata +
        '" target="_blank">Verifikasi Proyek</a>',
        didClose: () => {
          reloadDataTable();
        }
    });
  } else {
    Swal.fire({
      icon: "error",
      title: result.data.status,
      text: result.data.response,
    });
  }
  console.log(result);
}

function postResponseFunction(result) {
  if (result.status === 200) {
    const katakata =
      "Berhasil memasukkan member baru ke project " + result.data.name;
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text:
        "Selamat kak proyek " +
        result.data.name +
        " dengan ID: " +
        result.data._id +
        " sudah mendapat member baru",
      footer:
        '<a href="https://wa.me/62895601060000?text=' +
        katakata +
        '" target="_blank">Verifikasi Proyek</a>',
      didClose: () => {
        reloadDataTable();
      },
    });
     
  } else {
    Swal.fire({
      icon: "error",
      title: result.data.status,
      text: result.data.response,
    });
  }
  console.log(result);
}

// Function to add event listeners to removeMemberButtons
function addRemoveMemberButtonListeners() {
  document.querySelectorAll(".removeMemberButton").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const projectName = button.getAttribute("data-project-name");
      const memberPhoneNumber = button.getAttribute("data-member-phonenumber");

      const result = await Swal.fire({
        title: "Hapus member ini?",
        text: "Kamu tidak dapat mengembalikan aksi ini!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Hapus member",
        cancelButtonText: "Kembali",
      });

      if (result.isConfirmed) {
        const memberWillBeDeleted = {
          project_name: projectName,
          phone_number: memberPhoneNumber,
        };

        deleteJSON(
          backend.project.anggota,
          "login",
          getCookie("login"),
          memberWillBeDeleted,
          removeMemberResponse
        ); 
        
      }
    });
  });
}



function removeMemberResponse(result) {
  if (result.status === 200) {
    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Member has been removed.",
      didClose: () => {
        reloadDataTable();
      },
    });
  } else {
    Swal.fire({
      icon: "error",
      title: result.data.status,
      text: result.data.response,
    });
  }
  console.log(result);
}

