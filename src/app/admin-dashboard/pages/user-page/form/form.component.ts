import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  // FormGroup para manejar el formulario
  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      nombreCompleto: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
      activo: [true], // Por defecto activo
      avatar: [''] // Para almacenar la URL o referencia del avatar
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
        return;
      }

      // Validar tamaño (2MB máximo)
      const maxSize = 2 * 1024 * 1024; // 2MB en bytes
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. Máximo 2MB permitido.');
        input.value = '';
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

      // Actualizar el form control con el nombre del archivo
      this.userForm.patchValue({
        avatar: file.name
      });
    }
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
      const formData = {
        ...this.userForm.value,
        avatarFile: this.selectedFile()
      };

      console.log('Datos del formulario:', formData);

      // Aquí puedes agregar la lógica para enviar los datos al servidor
      // Por ejemplo, llamar a un servicio

    } else {
      console.log('Formulario inválido');
      this.markFormGroupTouched();
    }
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
