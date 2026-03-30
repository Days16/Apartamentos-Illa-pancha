// @ts-nocheck
/**
 * Hoja de Registro de Entrada — imprimible.
 * Se abre en ventana nueva con window.print().
 * Los datos del huésped se pre-rellenan desde la reserva.
 */

interface RegistroProps {
  reservation: {
    guest: string;
    email: string;
    phone?: string | null;
    checkin: string;
    checkout: string;
    apt?: string;
    apt_slug?: string;
  };
  settings?: {
    registro_titulo?: string;
    registro_identificador?: string;
    registro_notas?: string;
    registro_campo1?: string;
    registro_campo2?: string;
  };
  apartmentName?: string;
}

function splitName(fullName: string) {
  const parts = (fullName || '').trim().split(' ');
  if (parts.length === 1) return { nombre: parts[0], apellidos: '' };
  return { nombre: parts[0], apellidos: parts.slice(1).join(' ') };
}

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function printRegistro(props: RegistroProps) {
  const { reservation, settings = {}, apartmentName } = props;
  const titulo = settings.registro_titulo || 'REGISTRO DE ENTRADA';
  const identificador = settings.registro_identificador || '';
  const notas = settings.registro_notas || '';
  const { nombre, apellidos } = splitName(reservation.guest);
  const aptLabel = apartmentName || reservation.apt || reservation.apt_slug || '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Registro de Entrada</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 28px 32px;
      max-width: 720px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      flex: 1;
    }
    .id-badge {
      font-size: 13px;
      font-weight: bold;
      border: 1px solid #000;
      padding: 3px 8px;
      margin-left: 12px;
      min-width: 36px;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      border: 1px solid #000;
      padding: 6px 8px;
      vertical-align: top;
    }
    .label {
      font-size: 10px;
      font-weight: bold;
      color: #222;
      display: block;
      margin-bottom: 2px;
    }
    .value {
      font-size: 12px;
      color: #000;
      min-height: 20px;
      display: block;
    }
    .tall td { height: 44px; }
    .sign td { height: 56px; }
    .notas {
      margin-top: 14px;
      font-size: 10px;
      color: #444;
      border-top: 1px solid #ccc;
      padding-top: 8px;
    }
    @media print {
      body { padding: 12px 16px; }
      @page { size: A4; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${titulo}${aptLabel ? ' &mdash; ' + aptLabel : ''}</h1>
    ${identificador ? `<div class="id-badge">${identificador}</div>` : ''}
  </div>

  <table>
    <tr class="tall">
      <td width="50%">
        <span class="label">Nombre / Name</span>
        <span class="value">${nombre}</span>
      </td>
      <td width="50%">
        <span class="label">Apellidos / Surname</span>
        <span class="value">${apellidos}</span>
      </td>
    </tr>
    <tr class="tall">
      <td>
        <span class="label">DNI / Identity card / Passport number</span>
        <span class="value">&nbsp;</span>
      </td>
      <td>
        <span class="label">Teléfono móvil / Telephone number</span>
        <span class="value">${reservation.phone || ''}</span>
      </td>
    </tr>
    <tr class="tall">
      <td>
        <span class="label">Población / City</span>
        <span class="value">&nbsp;</span>
      </td>
      <td>
        <span class="label">País / Country</span>
        <span class="value">&nbsp;</span>
      </td>
    </tr>
    <tr class="tall">
      <td>
        <span class="label">Correo electrónico / Email</span>
        <span class="value">${reservation.email || ''}</span>
      </td>
      <td>
        <span class="label">Fecha de entrada / Check-in date</span>
        <span class="value">${formatDate(reservation.checkin)}</span>
      </td>
    </tr>
    <tr class="tall">
      <td>
        <span class="label">Fecha de salida / Check-out date</span>
        <span class="value">${formatDate(reservation.checkout)}</span>
      </td>
      <td>
        <span class="label">Fecha de hoy / Date of today</span>
        <span class="value">${new Date().toLocaleDateString('es-ES')}</span>
      </td>
    </tr>
    <tr class="sign">
      <td colspan="2">
        <span class="label">Firma / Signature</span>
        <span class="value">&nbsp;</span>
      </td>
    </tr>
  </table>

  ${notas ? `<div class="notas">${notas}</div>` : ''}

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=700');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
