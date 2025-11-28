// script/login.js
document.addEventListener("DOMContentLoaded", function () {
    // Redirección después de login exitoso
    if (window.location.pathname === "/login-success") {
        window.location.href = "/";
    }

    // Manejar estado del botón de login
    const loginForm = document.querySelector('form[th\\:action="@{/login}"]');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';

                // Re-enable after 5 seconds in case of error
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Iniciar sesión';
                }, 5000);
            }
        });
    }
});