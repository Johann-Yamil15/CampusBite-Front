import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CafeteriaFacade } from '../../../application/cafeteria.facade';

@Component({
  selector: 'app-cafeteria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cafeteria-form.html',
  styleUrls: ['./cafeteria-form.scss']
})
export class CafeteriaFormComponent implements OnInit {
  cafeteriaForm!: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  // 2. Inyecta el Facade en el constructor
  constructor(private fb: FormBuilder, private cafeteriaFacade: CafeteriaFacade) {}

  ngOnInit(): void {
    this.cafeteriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      ubicacion: ['', Validators.required],
      horario: ['', Validators.required],
      descripcion: ['']
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.selectedFile = null;
  }

  onSubmit() {
    if (this.cafeteriaForm.valid) {
      const formData = {
        ...this.cafeteriaForm.value,
        logo: this.selectedFile
      };
      
      // 3. Envía los datos al Facade
      this.cafeteriaFacade.registrarCafeteria(formData);
      
      this.cafeteriaForm.reset();
      this.removeImage();
    } else {
      this.cafeteriaForm.markAllAsTouched();
    }
  }
}