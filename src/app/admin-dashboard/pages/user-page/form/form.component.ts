import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../../users/services/users.service';
import { User } from '../../../../users/interfaces/user.interface';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './form.component.html',
  styles: [`
    @media (max-width: 1024px) {
      .container form > div {
        flex-direction: column !important;
      }

      .container form > div > div:first-child {
        width: 100% !important;
      }

      .container form > div > div:last-child {
        width: 100% !important;
        border-left: none !important;
        border-top: 2px solid #e5e7eb !important;
        padding-left: 0 !important;
        padding-top: 2rem !important;
      }
    }
  `]
})
export class FormComponent {

  // Signals para manejar la preview del avatar
  avatarPreview = signal<string>('');
  selectedFile = signal<File | null>(null);

  router = inject(Router);
  usersService = inject(UsuariosService);

  // FormGroup para manejar el formulario
  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      nombreCompleto: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
      activo: [true], // Por defecto activo
      // avatar: [''] // Para almacenar la URL o referencia del avatar
    });
  }

  /**
   * Maneja la selección de archivo para el avatar
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de archivo no permitido. Use JPG, PNG o GIF.');
        input.value = '';
        this.selectedFile.set(null);
        this.avatarPreview.set('');
        return;
      }

      // Validar tamaño (4MB máximo)
      const maxSize = 4 * 1024 * 1024; // 2MB en bytes
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. Máximo 4MB permitido.');
        input.value = '';
        this.selectedFile.set(null);
        this.avatarPreview.set('');
        return;
      }

      // Guardar archivo y crear preview
      this.selectedFile.set(file);

      // Crear URL temporal para la preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.avatarPreview.set(result);
      };
      reader.readAsDataURL(file);

    }
  }

  /**
   * Genera la ruta del avatar basada en el nombre del archivo
   */
  private generateAvatarUrl(fileName: string): string {
    return `assets/images/${fileName}`;
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Usar un avatar SVG por defecto
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCA3NEM2MS4wNDU3IDc0IDcwIDY1LjA0NTcgNzAgNTRDNzAgNDIuOTU0MyA2MS4wNDU3IDM0IDUwIDM0QzM4Ljk1NDMgMzQgMzAgNDIuOTU0MyAzMCA1NEMzMCA2NS4wNDU3IDM4Ljk1NDMgNzQgNTAgNzRaIiBmaWxsPSIjOUI5REEwIi8+CjxwYXRoIGQ9Ik01MCA0OEM1My4zMTM3IDQ4IDU2IDQ1LjMxMzcgNTYgNDJDNTYgMzguNjg2MyA1My4zMTM3IDM2IDUwIDM2QzQ2LjY4NjMgMzYgNDQgMzguNjg2MyA0NCA0MkM0NCA0NS4zMTM3IDQ2LjY4NjMgNDggNTAgNDhaIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
  }

  /**
   * Envía el formulario
   */
  onSubmit(): void {
    if (this.userForm.valid) {
      const selectedFile = this.selectedFile();

      const userData  = {
        ...this.userForm.value,
        avatarUrl: selectedFile ? this.generateAvatarUrl(selectedFile.name) : '',
        tema: 'night'
      };

    console.log('Datos del formulario:', userData);

    this.usersService.createUsuario(userData as User).subscribe(
      usuario => {
        console.log('Propietario creado:', usuario);

        if (selectedFile) {
          this.uploadAvatarFile(selectedFile, usuario);
        }

        this.resetForm();
        // this.userForm.reset();
        // this.userForm.markAsUntouched();
        // this.userForm.markAsPristine();
        this.router.navigate(['/admin/admin-usuarios']);
      });

    } else {
      console.log('Formulario inválido');
      this.markFormGroupTouched();
    }
  }

  /**
   * Método para subir el archivo físico al servidor
   * Este es un ejemplo básico - ajústalo según tu backend
   */
  private uploadAvatarFile(file: File, usuario: User): void {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', usuario.id?.toString() || '');

    // Ejemplo de llamada para subir el archivo
    // Necesitarás implementar este método en tu service
    this.usersService.uploadAvatar(formData).subscribe({
      next: (response) => {
        console.log('Avatar subido correctamente:', response);
      },
      error: (error) => {
        console.error('Error al subir avatar:', error);
        // Opcional: mostrar un mensaje de advertencia al usuario
      }
    });
  }

  /**
   * Marca todos los campos como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Resetea el formulario
   */
  resetForm(): void {
    this.userForm.reset({
      activo: true // Mantener activo como valor por defecto
    });
    this.avatarPreview.set('');
    this.selectedFile.set(null);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Getters para facilitar el acceso a los controles en el template
   */
  get usuario() { return this.userForm.get('usuario'); }
  get nombreCompleto() { return this.userForm.get('nombreCompleto'); }
  get email() { return this.userForm.get('email'); }
  get clave() { return this.userForm.get('clave'); }
  get activo() { return this.userForm.get('activo'); }
}
