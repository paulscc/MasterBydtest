import { NextResponse } from 'next/server';
import { createClient } from '@/actions/clients';

export async function POST(request: Request) {
  try {
    let formData: FormData;
    
    // Detectar si es JSON o FormData
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Es JSON - convertir a FormData
      const body = await request.json();
      formData = new FormData();
      Object.entries(body).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    } else {
      // Es FormData - usar directamente
      formData = await request.formData();
    }
    
    const result = await createClient(formData);
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error en endpoint /api/clients/create:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}