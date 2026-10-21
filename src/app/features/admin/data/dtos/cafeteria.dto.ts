export interface CreateCafeteriaDto {
  nombre: string;
  ubicacion: string;
  horario: string;
  descripcion: string;
  logo: File | null; 
}