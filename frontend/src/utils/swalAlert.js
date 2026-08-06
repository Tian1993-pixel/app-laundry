import Swal from 'sweetalert2';

// Styled SweetAlert2 instance with app branding
const CustomSwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs mx-1 shadow transition',
    cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs mx-1 transition',
    popup: 'rounded-3xl p-6 font-sans shadow-2xl border border-slate-200'
  },
  buttonsStyling: false
});

export const showAlertSuccess = (title, text = '') => {
  return CustomSwal.fire({
    icon: 'success',
    title: `<span class="font-extrabold text-slate-800 text-base">${title}</span>`,
    html: text ? `<p class="text-xs text-slate-600 mt-1">${text}</p>` : '',
    confirmButtonText: 'OK, Siap!'
  });
};

export const showAlertError = (title, text = '') => {
  return CustomSwal.fire({
    icon: 'error',
    title: `<span class="font-extrabold text-red-600 text-base">${title}</span>`,
    html: text ? `<p class="text-xs text-slate-600 mt-1">${text}</p>` : '',
    confirmButtonText: 'Tutup'
  });
};

export const showAlertWarning = (title, text = '') => {
  return CustomSwal.fire({
    icon: 'warning',
    title: `<span class="font-extrabold text-amber-600 text-base">${title}</span>`,
    html: text ? `<p class="text-xs text-slate-600 mt-1">${text}</p>` : '',
    confirmButtonText: 'Mengerti'
  });
};

export const showConfirmModal = (title, text, confirmText = 'Ya, Hapus Sekarang') => {
  return Swal.fire({
    title: `<span class="font-extrabold text-slate-800 text-base">${title}</span>`,
    html: text ? `<p class="text-xs text-slate-600 mt-1">${text}</p>` : '',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Batal',
    customClass: {
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs mx-1 shadow transition cursor-pointer',
      cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs mx-1 transition cursor-pointer',
      popup: 'rounded-3xl p-6 font-sans shadow-2xl border border-slate-200 z-[99999]'
    },
    buttonsStyling: false
  });
};
