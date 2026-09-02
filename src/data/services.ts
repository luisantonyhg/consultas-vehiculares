export interface Service {
  id: string;
  title: string;
  url: string;
  logo: string;
  watermark?: string;
  reverse?: boolean;
  alignLeft?: boolean;
}

export interface ServiceSection {
  id: string;
  title: string;
  icon: string;
  services: Service[];
}

export const SERVICES_DATA: ServiceSection[] = [
  {
    id: "registrales",
    title: "Consultas Principales y Registrales",
    icon: "fas fa-search",
    services: [
      {
        id: "sunarp-consulta",
        title: "Consulta Vehicular (SUNARP)",
        url: "https://consultavehicular.sunarp.gob.pe/consulta-vehicular/inicio",
        logo: "/assets/sunarp.jpeg"
      },
      {
        id: "apeseg-soat",
        title: "Consultar SOAT Vigente",
        url: "https://www.apeseg.org.pe/consultas-soat/",
        logo: "/assets/apeseg.png"
      },
      {
        id: "apeseg-soat-detallado",
        title: "SOAT APESEG Detallado",
        url: "https://intranet.apeseg.org.pe/soat/hispla.php",
        logo: "/assets/apeseg.png"
      },
      {
        id: "mtc-citv",
        title: "Inspección Técnica Vehicular MTC",
        url: "https://rec.mtc.gob.pe/Citv/ArConsultaCitv",
        logo: "/assets/mtc.png"
      },
      {
        id: "mtc-licencias",
        title: "Licencia de Conducir (MTC)",
        url: "https://licencias.mtc.gob.pe/#/index",
        logo: "/assets/mtc.png"
      },
      {
        id: "pnp-lunas",
        title: "Permisos de Lunas (PNP)",
        url: "https://sistemas.policia.gob.pe/consultalunas/ConsultarServicioLunas",
        logo: "/assets/logopnp.png"
      },
      {
        id: "infogas-consulta",
        title: "Consulta Info Gas",
        url: "https://vh.infogas.com.pe/",
        logo: "/assets/infogas.png"
      },
      {
        id: "fise-ahorro-gnv",
        title: "Ahorro GNV Deuda (FISE)",
        url: "https://fise.minem.gob.pe:23308/consulta-taller/pages/consultaTaller/inicio",
        logo: "/assets/fise.png"
      },
      {
        id: "sunarp-robo",
        title: "Alerta Robo (SUNARP)",
        url: "https://alertarobo.sunarp.gob.pe/alerta-robo/",
        logo: "/assets/sunarp.jpeg"
      }
    ]
  },
  {
    id: "infracciones",
    title: "Infracciones Lima y Callao",
    icon: "fas fa-exclamation-circle",
    services: [
      {
        id: "sat-papeleta",
        title: "Papeleta Lima (SAT)",
        url: "https://www.sat.gob.pe/VirtualSAT/modulos/papeletas.aspx",
        logo: "/assets/sat.png"
      },
      {
        id: "callao-papeleta",
        title: "Papeleta Callao",
        url: "https://pagopapeletascallao.pe/public/",
        logo: "/assets/callao.png"
      },
      {
        id: "sat-deuda",
        title: "Consulta Deuda Placa SAT",
        url: "https://www.sat.gob.pe/pagosenlinea/",
        logo: "/assets/sat.png"
      },
      {
        id: "sat-captura",
        title: "Captura de Vehículo SAT",
        url: "https://www.sat.gob.pe/VirtualSAT/modulos/Capturas.aspx",
        logo: "/assets/sat.png"
      },
      {
        id: "sat-internamiento",
        title: "Internamiento Vehículo",
        url: "https://www.sat.gob.pe/VirtualSAT/modulos/ConsultaDeposito.aspx",
        logo: "/assets/sat.png"
      },
      {
        id: "sutran-record",
        title: "Record de Infracciones SUTRAN",
        url: "https://www.sutran.gob.pe/consultas/record-de-infracciones/record-de-infracciones/",
        logo: "/assets/sutran.png"
      },
      {
        id: "sutran-cinemometro",
        title: "Ver Papeletas SUTRAN",
        url: "https://webexterno.sutran.gob.pe/WebExterno/Pages/frmPapeletasCinemometro.aspx",
        logo: "/assets/sutran.png"
      },
      {
        id: "atu-taxis",
        title: "Taxis Autorizados (ATU)",
        url: "https://soluciones.atu.gob.pe/ConsultaVehiculo/",
        logo: "/assets/atu.png"
      },
      {
        id: "munlima-placas",
        title: "Muni Lima Placas",
        url: "https://aplicativos.munlima.gob.pe/extranet/consultagmu/",
        logo: "/assets/munlima.png"
      },
      {
        id: "sutran-verifica",
        title: "Verifica Infracción SUTRAN",
        url: "https://www.sutran.gob.pe/consultas/record-de-infracciones/verifica-tu-infraccion/",
        logo: "/assets/sutran.png"
      },
      {
        id: "sbs-siniestralidad",
        title: "Siniestralidad SOAT (SBS)",
        url: "https://servicios.sbs.gob.pe/reportesoat/",
        logo: "/assets/sbs.png"
      },
      {
        id: "atu-multas",
        title: "Multas ATU",
        url: "https://pasarela.atu.gob.pe/CONSULTA%20Y%20PAGOS%20INFRACCIONES#",
        logo: "/assets/atu.png"
      },
      {
        id: "pnp-velocidad",
        title: "Foto Papeleta Velocidad",
        url: "http://www.pit.gob.pe/pit2007/EstadoCuentaVelocidad.aspx",
        logo: "/assets/logopnp.png"
      }
    ]
  },
  {
    id: "tramites",
    title: "Gestión y Trámites",
    icon: "fas fa-tools",
    services: [
      {
        id: "aap-placa",
        title: "Cambio de Placa (AAP)",
        url: "https://www.placas.pe/#/home/verificarEstadoPlaca",
        logo: "/assets/aap.png"
      },
      {
        id: "apeseg-precios",
        title: "Precios Referenciales",
        url: "https://www.apeseg.org.pe/lista-referencial-de-precios/",
        logo: "/assets/apeseg.png"
      },
      {
        id: "sunarp-tiv",
        title: "TIV Electrónica (SUNARP)",
        url: "https://tivative.sunarp.gob.pe/tivative/",
        logo: "/assets/sunarp.jpeg"
      }
    ]
  },
  {
    id: "provincias",
    title: "Papeletas en Provincias",
    icon: "fas fa-map-marked-alt",
    services: [
      {
        id: "arequipa-papeleta",
        title: "Papeleta Arequipa",
        url: "https://www.muniarequipa.gob.pe/oficina-virtual/c0nInfrPermisos/faltas/papeletas.php",
        logo: "/assets/arequipa.png"
      },
      {
        id: "cajamarca-papeleta",
        title: "Papeleta Cajamarca",
        url: "https://www.satcajamarca.gob.pe/consultas",
        logo: "/assets/cajamarca.png"
      },
      {
        id: "chachapoyas-papeleta",
        title: "Papeleta Chachapoyas",
        url: "https://app.munichachapoyas.gob.pe/servicios/consulta_papeletas/app/papeletas.php",
        logo: "/assets/chachapoyas.png"
      },
      {
        id: "chiclayo-papeleta",
        title: "Papeleta Chiclayo",
        url: "https://virtualsatch.satch.gob.pe/virtualsatch/record_infracciones/buscar_placa_",
        logo: "/assets/perushield.png"
      },
      {
        id: "cusco-papeleta",
        title: "Papeleta Cusco",
        url: "https://cusco.gob.pe/informatica/index.php/",
        logo: "/assets/cusco.png"
      },
      {
        id: "huanuco-papeleta",
        title: "Papeleta Huánuco",
        url: "https://www.munihuanuco.gob.pe/wp-content/servicios/transportes/gt_papeletas.php",
        logo: "/assets/perushield.png"
      },
      {
        id: "ica-papeleta",
        title: "Papeleta Ica",
        url: "https://m.satica.gob.pe/",
        logo: "/assets/perushield.png"
      },
      {
        id: "piura-papeleta",
        title: "Papeleta Piura",
        url: "https://fiscalizacionelectronica.munipiura.gob.pe/",
        logo: "/assets/perushield.png"
      },
      {
        id: "tacna-papeleta",
        title: "Papeleta Tacna",
        url: "https://www.munitacna.gob.pe/pagina/sf/servicios/papeletas",
        logo: "/assets/perushield.png"
      },
      {
        id: "tarapoto-papeleta",
        title: "Papeleta Tarapoto",
        url: "https://www.sat-t.gob.pe/",
        logo: "/assets/perushield.png"
      },
      {
        id: "trujillo-papeleta",
        title: "Papeleta Trujillo",
        url: "https://digital.satt.gob.pe/pagos/",
        logo: "/assets/trujillo.png"
      }
    ]
  },
  {
    id: "tecnicas",
    title: "Consultas Técnicas y Especializadas",
    icon: "fas fa-microchip",
    services: [
      {
        id: "osinergmin-hidrocarburos",
        title: "Vehículos habilitados para Hidrocarburos (OSINERGMIN)",
        url: "https://pvo.osinergmin.gob.pe/msfh5/registroHidrocarburos.xhtml?method=buscar",
        logo: "/assets/osinergmin.png",
        reverse: true,
        alignLeft: true
      }
    ]
  }
];
