/* eslint-disable */
// @ts-nocheck
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useLang } from '../contexts/LangContext';
import { useT } from '../i18n/translations';
import { useSettings } from '../contexts/SettingsContext';

// ─────────────────────────────────────────────────────────────────────────────
// Política de cancelación traducida (ES, EN, FR, DE, PT)
// ─────────────────────────────────────────────────────────────────────────────
function renderCancellationPolicy(lang: string, depositPct: number) {
  const SITE = "www.apartamentosillapancha.com";
  const EMAIL = "info@apartamentosillapancha.com";

  const content: Record<string, any> = {
    ES: {
      title: "5. Política de cancelación",
      intro: (
        <>
          Gracias por elegir nuestros apartamentos en <strong>{SITE}</strong>. Una vez realizada
          tu reserva, recibirás un correo electrónico de confirmación. Al abonar el {depositPct}%
          del total, tu apartamento quedará reservado para la fecha seleccionada.
        </>
      ),
      noticeLabel: "Si necesitas cancelar tu reserva, ten en cuenta lo siguiente:",
      tiers: [
        ["De 0 a 7 días antes de tu llegada:", <>Se cobrará el 100% del importe de la reserva. <strong>No hay reembolso.</strong></>],
        ["De 8 a 14 días antes de tu llegada:", "Te devolvemos el 50% del depósito."],
        ["De 15 a 29 días antes de tu llegada:", "Te devolvemos el 75% del depósito."],
        ["30 días o más antes de tu llegada:", "Te devolvemos el 100% del depósito."],
      ],
      generalTitle: "Condiciones generales",
      general: [
        ["Reserva garantizada:", "Tu reserva se confirma una vez recibido el anticipo. Si no te presentas sin avisar, se cobrará el 100% de la estancia."],
        ["Estancia mínima:", "En julio y agosto, la estancia mínima es de 5 noches."],
        ["Capacidad del apartamento:", "El número de personas no debe superar la capacidad máxima del apartamento."],
        ["Pago final:", "El total de la estancia se abonará el día de llegada, descontando el anticipo ya pagado."],
        ["Horarios de entrada y salida:", "La entrada es a partir de las 16:00 h y la salida debe realizarse antes de las 11:00 h para garantizar el servicio de limpieza."],
        ["Abandono anticipado:", "Si abandonas el apartamento antes de la fecha prevista, no se realizará ningún reembolso."],
        ["Documentación necesaria:", "Al llegar, necesitarás presentar el DNI o pasaporte de todos los huéspedes."],
        ["No presentarse:", "Si no llegas en las 24 horas siguientes a la fecha de entrada, tu reserva se considerará cancelada y perderás el importe abonado."],
        ["Prórroga de estancia:", "Si deseas ampliar tu estancia, consulta con nosotros. Estará sujeta a disponibilidad."],
        ["Modificaciones o cancelaciones:", <>Para cualquier cambio, contacta con nosotros por escrito a <strong>{EMAIL}</strong>.</>],
        ["Condiciones meteorológicas:", "No se ofrecen reembolsos ni descuentos por mal tiempo."],
        ["Justificación de cancelaciones:", <>Si cancelas por motivos excepcionales, envíanos la documentación justificativa junto con tu solicitud. Se podrán ofrecer cambios de fechas (hasta 6 meses) en casos justificados y según disponibilidad.</>],
        ["Grupos:", "Las reservas de más de un apartamento deberán ser autorizadas previamente. No está permitido intercambiar mobiliario, ropa de cama o menaje entre apartamentos."],
        ["Menores:", "Los menores deben estar acompañados por sus padres o tutores legales. En caso contrario, no se permitirá el acceso."],
      ],
    },
    EN: {
      title: "5. Cancellation policy",
      intro: (
        <>
          Thank you for choosing our apartments at <strong>{SITE}</strong>. Once your booking is
          made, you will receive a confirmation email. By paying {depositPct}% of the total, your
          apartment will be reserved for the selected dates.
        </>
      ),
      noticeLabel: "If you need to cancel your booking, please note the following:",
      tiers: [
        ["0 to 7 days before your arrival:", <>100% of the booking amount will be charged. <strong>No refund.</strong></>],
        ["8 to 14 days before your arrival:", "We refund 50% of the deposit."],
        ["15 to 29 days before your arrival:", "We refund 75% of the deposit."],
        ["30 days or more before your arrival:", "We refund 100% of the deposit."],
      ],
      generalTitle: "General conditions",
      general: [
        ["Guaranteed reservation:", "Your booking is confirmed once the deposit is received. If you do not show up without notice, 100% of the stay will be charged."],
        ["Minimum stay:", "In July and August, the minimum stay is 5 nights."],
        ["Apartment capacity:", "The number of guests must not exceed the maximum capacity of the apartment."],
        ["Final payment:", "The total of the stay must be paid on the day of arrival, deducting the deposit already paid."],
        ["Check-in and check-out times:", "Check-in is from 4:00 PM to 7:00 PM and check-out must be before 11:00 AM to guarantee the cleaning service."],
        ["Early departure:", "If you leave the apartment before the scheduled date, no refund will be issued."],
        ["Required documentation:", "On arrival, you must present the ID or passport of all guests."],
        ["No-show:", "If you do not arrive within 24 hours of the check-in date, your booking will be considered cancelled and you will lose the amount paid."],
        ["Stay extension:", "If you wish to extend your stay, please ask us. It will be subject to availability."],
        ["Modifications or cancellations:", <>For any changes, please contact us in writing at <strong>{EMAIL}</strong>.</>],
        ["Weather conditions:", "No refunds or discounts are offered for bad weather."],
        ["Cancellation justification:", <>If you cancel for exceptional reasons, please send us supporting documentation with your request. Date changes (up to 6 months) may be offered in justified cases and subject to availability.</>],
        ["Groups:", "Bookings for more than one apartment must be previously authorised. Exchanging furniture, bed linen or kitchenware between apartments is not permitted."],
        ["Minors:", "Minors must be accompanied by their parents or legal guardians. Otherwise, access will not be permitted."],
      ],
    },
    FR: {
      title: "5. Politique d'annulation",
      intro: (
        <>
          Merci d"avoir choisi nos appartements sur <strong>{SITE}</strong>. Une fois votre
          réservation effectuée, vous recevrez un e-mail de confirmation. En réglant {depositPct}%
          du total, votre appartement sera réservé pour les dates sélectionnées.
        </>
      ),
      noticeLabel: "Si vous devez annuler votre réservation, veuillez tenir compte de ce qui suit :",
      tiers: [
        ["De 0 à 7 jours avant votre arrivée :", <>100% du montant de la réservation sera facturé. <strong>Aucun remboursement.</strong></>],
        ["De 8 à 14 jours avant votre arrivée :", "Nous remboursons 50% de l'acompte."],
        ["De 15 à 29 jours avant votre arrivée :", "Nous remboursons 75% de l'acompte."],
        ["30 jours ou plus avant votre arrivée :", "Nous remboursons 100% de l'acompte."],
      ],
      generalTitle: "Conditions générales",
      general: [
        ["Réservation garantie :", "Votre réservation est confirmée dès réception de l'acompte. En cas de non-présentation sans préavis, 100% du séjour sera facturé."],
        ["Séjour minimum :", "En juillet et août, le séjour minimum est de 5 nuits."],
        ["Capacité de l'appartement :", "Le nombre de personnes ne doit pas dépasser la capacité maximale de l'appartement."],
        ["Paiement final :", "Le total du séjour doit être réglé le jour de l'arrivée, en déduisant l'acompte déjà payé."],
        ["Horaires d'arrivée et de départ :", "L'arrivée se fait à partir de 16h00 jusqu'à 19h00 et le départ doit avoir lieu avant 11h00 pour garantir le service de ménage."],
        ["Départ anticipé :", "Si vous quittez l'appartement avant la date prévue, aucun remboursement ne sera effectué."],
        ["Documents requis :", "À votre arrivée, vous devrez présenter la pièce d'identité ou le passeport de tous les occupants."],
        ["Non-présentation :", "Si vous n'arrivez pas dans les 24 heures suivant la date d'entrée, votre réservation sera considérée comme annulée et vous perdrez le montant versé."],
        ["Prolongation du séjour :", "Si vous souhaitez prolonger votre séjour, consultez-nous. Cela sera soumis à disponibilité."],
        ["Modifications ou annulations :", <>Pour toute modification, contactez-nous par écrit à <strong>{EMAIL}</strong>.</>],
        ["Conditions météorologiques :", "Aucun remboursement ni réduction n'est accordé en cas de mauvais temps."],
        ["Justification des annulations :", <>En cas d'annulation pour motifs exceptionnels, veuillez nous envoyer les justificatifs avec votre demande. Des changements de dates (jusqu'à 6 mois) peuvent être proposés dans les cas justifiés et selon disponibilité.</>],
        ["Groupes :", "Les réservations de plus d'un appartement doivent être préalablement autorisées. L'échange de mobilier, de linge de lit ou de vaisselle entre appartements n'est pas autorisé."],
        ["Mineurs :", "Les mineurs doivent être accompagnés de leurs parents ou tuteurs légaux. Dans le cas contraire, l'accès ne sera pas autorisé."],
      ],
    },
    DE: {
      title: "5. Stornierungsbedingungen",
      intro: (
        <>
          Vielen Dank, dass Sie sich für unsere Apartments auf <strong>{SITE}</strong> entschieden
          haben. Nach Ihrer Buchung erhalten Sie eine Bestätigungs-E-Mail. Mit der Zahlung von{" "}
          {depositPct}% des Gesamtbetrags ist Ihr Apartment für den gewählten Zeitraum reserviert.
        </>
      ),
      noticeLabel: "Falls Sie Ihre Buchung stornieren müssen, beachten Sie bitte Folgendes:",
      tiers: [
        ["0 bis 7 Tage vor Ihrer Anreise:", <>Es werden 100% des Buchungsbetrags berechnet. <strong>Keine Rückerstattung.</strong></>],
        ["8 bis 14 Tage vor Ihrer Anreise:", "Wir erstatten 50% der Anzahlung."],
        ["15 bis 29 Tage vor Ihrer Anreise:", "Wir erstatten 75% der Anzahlung."],
        ["30 Tage oder mehr vor Ihrer Anreise:", "Wir erstatten 100% der Anzahlung."],
      ],
      generalTitle: "Allgemeine Bedingungen",
      general: [
        ["Garantierte Reservierung:", "Ihre Buchung wird bestätigt, sobald die Anzahlung eingegangen ist. Bei Nichtanreise ohne Vorankündigung werden 100% des Aufenthalts berechnet."],
        ["Mindestaufenthalt:", "Im Juli und August beträgt der Mindestaufenthalt 5 Nächte."],
        ["Kapazität des Apartments:", "Die Anzahl der Personen darf die maximale Kapazität des Apartments nicht überschreiten."],
        ["Schlusszahlung:", "Der Gesamtbetrag des Aufenthalts ist am Anreisetag zu zahlen, abzüglich der bereits geleisteten Anzahlung."],
        ["Check-in- und Check-out-Zeiten:", "Check-in ist von 16:00 bis 19:00 Uhr und Check-out muss vor 11:00 Uhr erfolgen, um den Reinigungsservice zu gewährleisten."],
        ["Vorzeitige Abreise:", "Wenn Sie das Apartment vor dem geplanten Datum verlassen, erfolgt keine Rückerstattung."],
        ["Erforderliche Dokumente:", "Bei der Ankunft müssen Sie den Ausweis oder Reisepass aller Gäste vorlegen."],
        ["Nichterscheinen:", "Wenn Sie nicht innerhalb von 24 Stunden nach dem Anreisedatum eintreffen, gilt Ihre Buchung als storniert und der gezahlte Betrag verfällt."],
        ["Verlängerung des Aufenthalts:", "Wenn Sie Ihren Aufenthalt verlängern möchten, fragen Sie uns. Dies erfolgt vorbehaltlich der Verfügbarkeit."],
        ["Änderungen oder Stornierungen:", <>Für Änderungen kontaktieren Sie uns bitte schriftlich unter <strong>{EMAIL}</strong>.</>],
        ["Wetterbedingungen:", "Bei schlechtem Wetter werden keine Rückerstattungen oder Rabatte gewährt."],
        ["Begründung von Stornierungen:", <>Bei Stornierung aus außergewöhnlichen Gründen senden Sie uns bitte die Belege mit Ihrem Antrag. Terminverschiebungen (bis zu 6 Monate) können in begründeten Fällen je nach Verfügbarkeit angeboten werden.</>],
        ["Gruppen:", "Buchungen für mehr als ein Apartment müssen vorher genehmigt werden. Der Austausch von Möbeln, Bettwäsche oder Küchenausstattung zwischen Apartments ist nicht gestattet."],
        ["Minderjährige:", "Minderjährige müssen von ihren Eltern oder gesetzlichen Vormund begleitet werden. Andernfalls wird der Zutritt verweigert."],
      ],
    },
    PT: {
      title: "5. Política de cancelamento",
      intro: (
        <>
          Obrigado por escolher os nossos apartamentos em <strong>{SITE}</strong>. Após efetuar a
          sua reserva, receberá um e-mail de confirmação. Ao pagar {depositPct}% do total, o seu
          apartamento ficará reservado para a data selecionada.
        </>
      ),
      noticeLabel: "Se precisar de cancelar a sua reserva, tenha em conta o seguinte:",
      tiers: [
        ["De 0 a 7 dias antes da sua chegada:", <>Será cobrado 100% do valor da reserva. <strong>Sem reembolso.</strong></>],
        ["De 8 a 14 dias antes da sua chegada:", "Devolvemos 50% do depósito."],
        ["De 15 a 29 dias antes da sua chegada:", "Devolvemos 75% do depósito."],
        ["30 dias ou mais antes da sua chegada:", "Devolvemos 100% do depósito."],
      ],
      generalTitle: "Condições gerais",
      general: [
        ["Reserva garantida:", "A sua reserva é confirmada após a receção do sinal. Se não comparecer sem aviso, será cobrado 100% da estadia."],
        ["Estadia mínima:", "Em julho e agosto, a estadia mínima é de 5 noites."],
        ["Capacidade do apartamento:", "O número de pessoas não pode exceder a capacidade máxima do apartamento."],
        ["Pagamento final:", "O total da estadia é pago no dia da chegada, descontando o sinal já pago."],
        ["Horários de entrada e saída:", "A entrada é a partir das 16:00 h até às 19:00 h e a saída deve ser efetuada antes das 11:00 h para garantir o serviço de limpeza."],
        ["Saída antecipada:", "Se abandonar o apartamento antes da data prevista, não haverá lugar a reembolso."],
        ["Documentação necessária:", "À chegada, terá de apresentar o documento de identificação ou passaporte de todos os hóspedes."],
        ["Não comparência:", "Se não chegar no prazo de 24 horas após a data de entrada, a sua reserva será considerada cancelada e perderá o valor pago."],
        ["Prolongamento da estadia:", "Se desejar prolongar a sua estadia, consulte-nos. Estará sujeito a disponibilidade."],
        ["Alterações ou cancelamentos:", <>Para qualquer alteração, contacte-nos por escrito para <strong>{EMAIL}</strong>.</>],
        ["Condições meteorológicas:", "Não são oferecidos reembolsos nem descontos por mau tempo."],
        ["Justificação de cancelamentos:", <>Se cancelar por motivos excecionais, envie-nos a documentação justificativa com o seu pedido. Podem ser oferecidas alterações de datas (até 6 meses) em casos justificados e sujeito a disponibilidade.</>],
        ["Grupos:", "As reservas de mais de um apartamento devem ser previamente autorizadas. Não é permitida a troca de mobiliário, roupa de cama ou utensílios de cozinha entre apartamentos."],
        ["Menores:", "Os menores devem ser acompanhados pelos seus pais ou tutores legais. Caso contrário, o acesso não será permitido."],
      ],
    },
  };

  const c = content[lang] || content.ES;

  return (
    <>
      <h2>{c.title}</h2>
      <p>{c.intro}</p>
      <p>{c.noticeLabel}</p>
      <ul>
        {c.tiers.map(([label, text]: any, i: number) => (
          <li key={`tier-${i}`}>
            <strong>{label}</strong> {text}
          </li>
        ))}
      </ul>

      <h3>{c.generalTitle}</h3>
      <ul>
        {c.general.map(([label, text]: any, i: number) => (
          <li key={`gen-${i}`}>
            <strong>{label}</strong> {text}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function Terminos() {
  const { lang } = useLang();
  const { settings } = useSettings();
  const T = useT(lang);
  const L = T.legal;

  const cancelDays = settings?.cancellation_free_days || 14;
  const depositPct = settings?.payment_deposit_percentage || 50;

  return (
    <>
      <SEO title={L.termsTitle} description={L.termsDesc} />
      <Navbar />
      <div className="w-full min-h-screen bg-white">
        <div className="grid place-items-center py-12 px-4 bg-gray-50 border-b border-gray-200">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">
            {L.docs}
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-navy mb-6">
            {L.termsTitle}
          </h1>
          <p className="text-xs text-gray-500 mt-2">{L.lastUpdate}</p>
        </div>
        <div className="policy-content max-w-3xl mx-auto px-4 py-12">
          <p>
            Estos Términos y Condiciones regulan la contratación de servicios de alojamiento
            turístico ofrecidos por <strong>Apartamentos Illa Pancha VUT</strong> (en adelante, «el
            Propietario» o «nosotros») a través del sitio web{' '}
            <strong>www.apartamentosillapancha.com</strong>. Al realizar una reserva, el cliente (en
            adelante, «el Huésped») acepta expresamente los presentes términos.
          </p>

          <h2>1. Identificación del prestador</h2>
          <p>
            <strong>Denominación:</strong> Ribatella Gestión S.L.
            <br />
            <strong>Domicilio:</strong> Ribadeo, Lugo, Galicia, España
            <br />
            <strong>Email:</strong> info@apartamentosillapancha.com
            <br />
            <strong>Teléfono:</strong> +34 614 52 30 77
          </p>

          <h2>2. Objeto</h2>
          <p>
            El Propietario ofrece el alquiler temporal de apartamentos turísticos ubicados en
            Ribadeo (Lugo, Galicia) para estancias de corta duración. Cada apartamento se describe
            detalladamente en la ficha correspondiente de la web, incluyendo capacidad máxima,
            equipamiento y normas específicas.
          </p>

          <h2>3. Proceso de reserva</h2>
          <p>La reserva queda formalizada cuando el Huésped:</p>
          <ul>
            <li>Cumplimenta el formulario de reserva con sus datos personales.</li>
            <li>Selecciona las fechas y el apartamento deseado.</li>
            <li>
              Abona el depósito del {depositPct}% del importe total mediante tarjeta de crédito o
              débito a través de la pasarela de pago segura (Stripe).
            </li>
            <li>Recibe la confirmación de reserva por correo electrónico.</li>
          </ul>
          <p>
            La reserva no se considerará confirmada hasta la recepción del email de confirmación. El
            Propietario se reserva el derecho a rechazar cualquier reserva en caso de
            indisponibilidad u otras circunstancias justificadas, en cuyo caso se devolverá
            íntegramente el depósito abonado.
          </p>

          <h2>4. Precios y forma de pago</h2>
          <p>
            Los precios indicados en la web incluyen el IVA aplicable y la limpieza final del
            apartamento. Se aplica el siguiente modelo de pago:
          </p>
          <ul>
            <li>
              <strong>{depositPct}% del total:</strong> cobrado mediante tarjeta en el momento de la
              reserva.
            </li>
            <li>
              <strong>{100 - depositPct}% restante:</strong> abonado en efectivo a la llegada al
              apartamento.
            </li>
          </ul>
          <p>
            Los precios de los extras o servicios adicionales se detallan en el proceso de reserva y
            se abonan junto con el depósito inicial.
          </p>

          {renderCancellationPolicy(lang, depositPct)}

          <h2>6. Check-in y check-out</h2>
          <ul>
            <li>
              <strong>Check-in:</strong> a partir de las 16:00 horas hasta las 19:00 horas del día
              de llegada. Fuera de este horario deberá coordinarse con el Propietario.
            </li>
            <li>
              <strong>Check-out:</strong> antes de las 11:00 horas del día de salida. El late
              check-out (hasta las 14:00 h) está disponible como servicio adicional sujeto a
              disponibilidad y con suplemento de 20 €.
            </li>
            <li>
              En el momento del check-in se verificará la identidad de todos los huéspedes conforme
              a la normativa de registro de viajeros.
            </li>
          </ul>

          <h2>7. Obligaciones del huésped</h2>
          <p>El Huésped se compromete a:</p>
          <ul>
            <li>No superar la capacidad máxima indicada para cada apartamento.</li>
            <li>
              Respetar las normas de convivencia y no molestar a los vecinos (silencio a partir de
              las 22:00 h hasta las 10:00 h del día siguiente).
            </li>
            <li>Evitar ruidos, golpeos o conductas molestas en las zonas comunes.</li>
            <li>No fumar en el interior de los apartamentos.</li>
            <li>No organizar fiestas o eventos.</li>
            <li>
              Entregar el apartamento en condiciones razonables de orden y limpieza. Retirar la
              basura y dejar la vajilla limpia. En caso contrario, se podrá aplicar un suplemento de
              limpieza (desde 20 €).
            </li>
            <li>No sacar mobiliario de ningún tipo al exterior (terrazas).</li>
            <li>Comunicar cualquier daño o avería al Propietario a la mayor brevedad posible.</li>
            <li>Hacer uso adecuado de todas las instalaciones.</li>
            <li>
              Abonar los desperfectos causados por un uso inadecuado del apartamento o sus
              instalaciones.
            </li>
          </ul>

          <h2>8. Mascotas</h2>
          <p>
            Las mascotas no están permitidas en nuestros apartamentos. El incumplimiento de esta
            norma podrá implicar la pérdida del depósito y el abandono inmediato del apartamento.
          </p>

          <h2>9. Responsabilidad</h2>
          <p>
            El Propietario no se responsabiliza de los objetos personales del Huésped ni de los
            daños derivados de causas de fuerza mayor, actos vandálicos de terceros o mal uso de las
            instalaciones. El Huésped es responsable de los daños causados durante su estancia.
          </p>

          <h2>10. Propiedad intelectual</h2>
          <p>
            Todos los contenidos del sitio web www.apartamentosillapancha.com (textos, imágenes,
            logotipos, diseño) son propiedad del Propietario o de sus licenciantes y están
            protegidos por la normativa de propiedad intelectual. Queda prohibida su reproducción
            sin autorización expresa.
          </p>

          <h2>11. Modificaciones</h2>
          <p>
            El Propietario se reserva el derecho a modificar estos términos en cualquier momento.
            Las modificaciones se publicarán en el sitio web con la fecha de actualización. Las
            reservas ya confirmadas se rigen por los términos vigentes en el momento de su
            formalización.
          </p>

          <h2>12. Legislación aplicable y jurisdicción</h2>
          <p>
            Estos términos se rigen por la legislación española. Para la resolución de cualquier
            controversia, las partes se someten, con renuncia expresa a cualquier otro fuero, a los
            Juzgados y Tribunales de Lugo (Galicia, España). Para conflictos de consumo, el Huésped
            también puede recurrir a la plataforma europea de resolución en línea de litigios:{' '}
            <strong>ec.europa.eu/consumers/odr</strong>.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
