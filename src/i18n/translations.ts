export type Language = 'es' | 'pt' | 'en';

export interface TranslationDictionary {
  // Navigation & Header
  nav_home: string;
  nav_my_subbot: string;
  nav_owner: string;
  nav_create_btn: string;
  nav_login_btn: string;
  nav_maintenance_alert: string;
  nav_active_session: string;
  nav_lang: string;

  // Hero Section
  hero_tag: string;
  hero_title_prefix: string;
  hero_title_highlight: string;
  hero_subtitle: string;
  hero_no_termux: string;
  hero_no_github: string;
  hero_no_nodejs: string;
  hero_100_web: string;
  hero_cta_create: string;
  hero_cta_login: string;
  hero_uptime_desc: string;
  hero_card1_title: string;
  hero_card1_desc: string;
  hero_card2_title: string;
  hero_card2_desc: string;
  hero_card3_title: string;
  hero_card3_desc: string;
  hero_stat_active: string;
  hero_stat_total: string;
  hero_stat_msgs: string;

  // Feature comparison
  comp_title: string;
  comp_subtitle: string;
  comp_trad_title: string;
  comp_trad_1: string;
  comp_trad_2: string;
  comp_trad_3: string;
  comp_trad_4: string;
  comp_wolfric_title: string;
  comp_wolfric_1: string;
  comp_wolfric_2: string;
  comp_wolfric_3: string;
  comp_wolfric_4: string;

  // Create SubBot Modal
  create_modal_title: string;
  create_modal_step1: string;
  create_modal_step2: string;
  create_country_label: string;
  create_phone_label: string;
  create_phone_placeholder: string;
  create_alias_label: string;
  create_alias_placeholder: string;
  create_method_label: string;
  create_method_code: string;
  create_method_code_desc: string;
  create_method_qr: string;
  create_method_qr_desc: string;
  create_submit_btn: string;
  create_submitting: string;
  create_pairing_title: string;
  create_pairing_desc_code: string;
  create_pairing_desc_qr: string;
  create_copy_code: string;
  create_copied: string;
  create_qr_placeholder: string;
  create_qr_step1: string;
  create_qr_step2: string;
  create_qr_step3: string;
  create_pin_warning: string;
  create_confirm_pairing_btn: string;
  create_verifying: string;

  // Login Modal
  login_modal_title: string;
  login_modal_subtitle: string;
  login_country_label: string;
  login_phone_label: string;
  login_phone_placeholder: string;
  login_pin_label: string;
  login_pin_placeholder: string;
  login_submit_btn: string;
  login_submitting: string;
  login_no_bot: string;
  login_create_link: string;

  // User Dashboard
  user_status_online: string;
  user_status_offline: string;
  user_status_reconnecting: string;
  user_status_banned: string;
  user_status_suspended: string;
  user_uptime: string;
  user_latency: string;
  user_memory: string;
  user_groups: string;
  user_restart_btn: string;
  user_disconnect_btn: string;
  user_reconnect_btn: string;
  user_relink_btn: string;
  user_logout_btn: string;
  user_tab_controls: string;
  user_tab_config: string;
  user_tab_backups: string;
  user_tab_logs: string;
  user_prefix_label: string;
  user_mode_label: string;
  user_mode_public: string;
  user_mode_groups: string;
  user_mode_private: string;
  user_antilink_label: string;
  user_antispam_label: string;
  user_stickers_label: string;
  user_welcome_label: string;
  user_welcome_text_label: string;
  user_reactions_label: string;
  user_botbio_label: string;
  user_save_config_btn: string;
  user_create_backup_btn: string;
  user_restore_btn: string;
  user_download_backup_btn: string;
  user_no_backups: string;
  user_no_logs: string;
  user_no_subbot_title: string;
  user_no_subbot_desc: string;
  user_create_subbot_action: string;
  user_login_subbot_action: string;

  // Owner Dashboard (Protected)
  owner_locked_title: string;
  owner_locked_desc: string;
  owner_input_label: string;
  owner_input_placeholder: string;
  owner_unlock_btn: string;
  owner_unlocking: string;
  owner_rate_limit_alert: string;
  owner_title: string;
  owner_badge: string;
  owner_desc: string;
  owner_logout: string;
  owner_tab_instances: string;
  owner_tab_versions: string;
  owner_tab_backups: string;
  owner_tab_logs: string;
  owner_tab_settings: string;
  owner_search_placeholder: string;
  owner_filter_all: string;
  owner_filter_online: string;
  owner_filter_offline: string;
  owner_filter_banned: string;
  owner_suspend_btn: string;
  owner_unsuspend_btn: string;
  owner_ban_btn: string;
  owner_unban_btn: string;
  owner_delete_btn: string;
  owner_global_update_btn: string;
  owner_upload_version_btn: string;
  owner_create_snapshot_btn: string;
  owner_maintenance_label: string;
  owner_maintenance_desc: string;
  owner_save_settings_btn: string;

  // Footer
  footer_rights: string;
  footer_multi_device: string;
  footer_encryption: string;
  footer_cloud: string;

  // Creators & Team
  nav_creators_btn: string;
  creators_section_badge: string;
  creators_section_title: string;
  creators_section_subtitle: string;
  creator_wolfric_role: string;
  creator_wolfric_desc: string;
  creator_thel_role: string;
  creator_thel_desc: string;
  creator_zerrdmc_role: string;
  creator_zerrdmc_desc: string;
  creators_copy_btn: string;
  creators_copied: string;
  creators_modal_title: string;
  creators_command_hint: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  es: {
    nav_home: 'Inicio',
    nav_my_subbot: 'Mi SubBot',
    nav_owner: 'Panel Propietario',
    nav_create_btn: 'Crear SubBot',
    nav_login_btn: 'Acceder a mi Bot',
    nav_maintenance_alert: 'Mantenimiento en curso',
    nav_active_session: 'SubBot Conectado',
    nav_lang: 'Idioma',

    hero_tag: 'Motor Multi-Device de Alta Disponibilidad',
    hero_title_prefix: '¿Quieres ser un',
    hero_title_highlight: 'SubBot de Wolfric?',
    hero_subtitle:
      'Convierte tu propio número de WhatsApp en una instancia activa de Wolfric en cuestión de segundos. Sesión segura en la nube, panel de administración exclusivo y aislamiento total.',
    hero_no_termux: 'Sin Termux ni comandos',
    hero_no_github: 'Sin clonar GitHub',
    hero_no_nodejs: 'Sin instalar Node.js',
    hero_100_web: '100% Desde la Web',
    hero_cta_create: 'Vincular mi SubBot Ahora',
    hero_cta_login: 'Acceder con mi Teléfono y PIN',
    hero_uptime_desc: 'Instancias activas 24/7 sin gastar la batería de tu teléfono',
    hero_card1_title: 'Vinculación Instantánea',
    hero_card1_desc: 'Código de 8 dígitos directo a WhatsApp o código QR visual.',
    hero_card2_title: 'Nube Aislada 24/7',
    hero_card2_desc: 'Tu sesión no se apaga cuando bloqueas tu teléfono o pierdes conexión.',
    hero_card3_title: 'Configuración Propia',
    hero_card3_desc: 'Prefijo, anti-link, stickers, bienvenida a grupos y backups propios.',
    hero_stat_active: 'SubBots Online',
    hero_stat_total: 'Instancias Registradas',
    hero_stat_msgs: 'Mensajes Procesados Hoy',

    comp_title: '¿Por qué Wolfric SubBot es diferente?',
    comp_subtitle: 'Olvídate de servidores caseros que se apagan cuando cierras la app',
    comp_trad_title: 'El método tradicional y tedioso',
    comp_trad_1: 'Instalar Termux o Node.js manualmente',
    comp_trad_2: 'Clonar repositorios de GitHub y resolver dependencias',
    comp_trad_3: 'El bot se apaga al bloquear el teléfono o sin batería',
    comp_trad_4: 'Pérdida total de datos si se borra la caché del móvil',
    comp_wolfric_title: 'Plataforma Oficial Wolfric SubBot',
    comp_wolfric_1: '100% Desde la web sin instalar nada en tu teléfono',
    comp_wolfric_2: 'Vinculación directa por código de 8 dígitos o código QR',
    comp_wolfric_3: 'Sesión activa en la nube 24/7 sin gastar batería',
    comp_wolfric_4: 'Copias de seguridad aisladas y panel de administración propio',

    create_modal_title: 'Vincular Nuevo SubBot Wolfric',
    create_modal_step1: '1. Datos de tu WhatsApp',
    create_modal_step2: '2. Vinculación en WhatsApp',
    create_country_label: 'País / Código Telefónico',
    create_phone_label: 'Número de WhatsApp',
    create_phone_placeholder: 'Ej. 912345678 o 5511999999999',
    create_alias_label: 'Nombre o Alias de tu SubBot (Opcional)',
    create_alias_placeholder: 'Ej. Lobo Alfa, Bot Familiar, Clan Wolfric',
    create_method_label: 'Método de Vinculación',
    create_method_code: 'Código de 8 Dígitos (Recomendado)',
    create_method_code_desc: 'Introduce el código en Dispositivos Vinculados > Vincular con número',
    create_method_qr: 'Escanear Código QR',
    create_method_qr_desc: 'Apunta la cámara de WhatsApp al código QR en pantalla',
    create_submit_btn: 'Generar Código de Vinculación',
    create_submitting: 'Creando instancia segura...',
    create_pairing_title: 'Vincula tu WhatsApp ahora',
    create_pairing_desc_code:
      'Abre WhatsApp > Ajustes > Dispositivos Vinculados > Vincular con número de teléfono e ingresa este código:',
    create_pairing_desc_qr:
      'Abre WhatsApp > Dispositivos Vinculados > Vincular un dispositivo y escanea este código:',
    create_copy_code: 'Copiar Código',
    create_copied: '¡Copiado!',
    create_qr_placeholder: 'Escanea este QR desde WhatsApp Web en tu móvil',
    create_qr_step1: '1. Abre WhatsApp en tu teléfono',
    create_qr_step2: '2. Toca Menú o Ajustes > Dispositivos vinculados',
    create_qr_step3: '3. Introduce el código o escanea para vincular',
    create_pin_warning: 'IMPORTANTE: Tu PIN de acceso para volver a iniciar sesión es:',
    create_confirm_pairing_btn: 'Confirmar y Entrar al Panel',
    create_verifying: 'Verificando vinculación...',

    login_modal_title: 'Acceder a mi SubBot Wolfric',
    login_modal_subtitle: 'Ingresa tu número registrado y tu PIN de seguridad de 4 dígitos',
    login_country_label: 'Código de País',
    login_phone_label: 'Número de WhatsApp',
    login_phone_placeholder: 'Ej. 912345678 o 11999999999',
    login_pin_label: 'PIN de Seguridad (4 dígitos)',
    login_pin_placeholder: 'Introduce tu PIN',
    login_submit_btn: 'Entrar a mi Panel de SubBot',
    login_submitting: 'Verificando credenciales...',
    login_no_bot: '¿Aún no tienes un SubBot de Wolfric?',
    login_create_link: 'Crear uno nuevo aquí',

    user_status_online: 'En Línea',
    user_status_offline: 'Desconectado',
    user_status_reconnecting: 'Reconectando...',
    user_status_banned: 'Baneado',
    user_status_suspended: 'Suspendido',
    user_uptime: 'Tiempo Activo',
    user_latency: 'Latencia Ping',
    user_memory: 'Memoria RAM',
    user_groups: 'Grupos Activos',
    user_restart_btn: 'Reiniciar SubBot',
    user_disconnect_btn: 'Desconectar',
    user_reconnect_btn: 'Reconectar',
    user_relink_btn: 'Volver a Vincular',
    user_logout_btn: 'Cerrar Sesión',
    user_tab_controls: 'Estado y Controles',
    user_tab_config: 'Configuración del Bot',
    user_tab_backups: 'Mis Copias de Seguridad',
    user_tab_logs: 'Historial de Eventos',
    user_prefix_label: 'Prefijo de Comandos',
    user_mode_label: 'Modo de Respuesta',
    user_mode_public: 'Público (Todos)',
    user_mode_groups: 'Solo en Grupos',
    user_mode_private: 'Solo Chats Privados',
    user_antilink_label: 'Anti-Link Automático',
    user_antispam_label: 'Protección Anti-Spam',
    user_stickers_label: 'Creador de Stickers Automático',
    user_welcome_label: 'Mensaje de Bienvenida a Grupos',
    user_welcome_text_label: 'Texto del Mensaje de Bienvenida',
    user_reactions_label: 'Reacciones Automáticas a Comandos',
    user_botbio_label: 'Estado / Biografía del Bot en WhatsApp',
    user_save_config_btn: 'Guardar Configuración',
    user_create_backup_btn: 'Crear Copia de Seguridad Ahora',
    user_restore_btn: 'Restaurar',
    user_download_backup_btn: 'Descargar Backup',
    user_no_backups: 'Aún no tienes copias de seguridad. Crea una para guardar tus preferencias.',
    user_no_logs: 'No hay eventos recientes registrados.',
    user_no_subbot_title: 'No tienes un SubBot vinculado',
    user_no_subbot_desc: 'Crea tu primer Wolfric SubBot ahora en menos de 1 minuto.',
    user_create_subbot_action: 'Crear mi Wolfric SubBot',
    user_login_subbot_action: 'Iniciar Sesión con PIN',

    owner_locked_title: 'Acceso Administrativo Protegido',
    owner_locked_desc: 'Área de alta seguridad exclusiva para el propietario de Wolfric.',
    owner_input_label: 'Clave Maestra de Seguridad',
    owner_input_placeholder: 'Introduce la clave de autorización',
    owner_unlock_btn: 'Desbloquear Panel',
    owner_unlocking: 'Autenticando...',
    owner_rate_limit_alert: 'Acceso bloqueado temporalmente por múltiples intentos fallidos. Espera 10 minutos.',
    owner_title: 'Panel Privado del Propietario',
    owner_badge: 'ACCESO SEGURO',
    owner_desc: 'Supervisión global, gestión de instancias, actualizaciones y versiones',
    owner_logout: 'Bloquear y Salir',
    owner_tab_instances: 'Instancias de SubBots',
    owner_tab_versions: 'Versiones de Wolfric',
    owner_tab_backups: 'Backups en Nube',
    owner_tab_logs: 'Auditoría & Logs',
    owner_tab_settings: 'Límites & Mantenimiento',
    owner_search_placeholder: 'Buscar por teléfono o nombre...',
    owner_filter_all: 'Todos',
    owner_filter_online: 'En Línea',
    owner_filter_offline: 'Desconectados',
    owner_filter_banned: 'Baneados',
    owner_suspend_btn: 'Suspender',
    owner_unsuspend_btn: 'Reactivar',
    owner_ban_btn: 'Banear',
    owner_unban_btn: 'Desbanear',
    owner_delete_btn: 'Eliminar',
    owner_global_update_btn: 'Actualización Global',
    owner_upload_version_btn: 'Subir Versión / Backup',
    owner_create_snapshot_btn: 'Crear Snapshot Global',
    owner_maintenance_label: 'Modo Mantenimiento',
    owner_maintenance_desc: 'Pausa registros y muestra aviso público a los usuarios.',
    owner_save_settings_btn: 'Guardar Ajustes de Plataforma',

    footer_rights: 'Plataforma Oficial Multi-Device para SubBots de Wolfric',
    footer_multi_device: 'Multi-Device Baileys Cloud',
    footer_encryption: 'Sesiones Cifradas de Extremo a Extremo',
    footer_cloud: 'Infraestructura Cloud Dedicada',

    nav_creators_btn: 'Creadores',
    creators_section_badge: 'EQUIPO OFICIAL WOLFRIC',
    creators_section_title: 'Créditos & Desarrolladores Oficiales',
    creators_section_subtitle: 'Los creadores y mentes maestras detrás de la plataforma oficial y el motor de SubBots de Wolfric.',
    creator_wolfric_role: 'Fundador & Desarrollador Principal',
    creator_wolfric_desc: 'Creador original de Wolfric, arquitecto del motor Baileys Multi-Device, lógica de comandos y ecosistema oficial.',
    creator_thel_role: 'Co-Creador & Desarrollador Core',
    creator_thel_desc: 'Especialista en seguridad de credenciales, optimización de sockets en tiempo real y rendimiento de instancias.',
    creator_zerrdmc_role: 'Co-Creador & Desarrollador',
    creator_zerrdmc_desc: 'Desarrollo de infraestructura en la nube, interfaz de usuario avanzada y gestión de almacenamiento seguro.',
    creators_copy_btn: 'Copiar Créditos Oficiales',
    creators_copied: '¡Créditos copiados al portapapeles!',
    creators_modal_title: 'Equipo de Desarrollo Wolfric',
    creators_command_hint: 'También puedes consultar los creadores enviando .creador o .creditos desde cualquier chat de tu SubBot.',
  },

  pt: {
    nav_home: 'Início',
    nav_my_subbot: 'Meu SubBot',
    nav_owner: 'Painel do Proprietário',
    nav_create_btn: 'Criar SubBot',
    nav_login_btn: 'Acessar meu Bot',
    nav_maintenance_alert: 'Manutenção em andamento',
    nav_active_session: 'SubBot Conectado',
    nav_lang: 'Idioma',

    hero_tag: 'Motor Multi-Device de Alta Disponibilidade',
    hero_title_prefix: 'Quer ser um',
    hero_title_highlight: 'SubBot do Wolfric?',
    hero_subtitle:
      'Transforme o seu próprio número de WhatsApp em uma instância ativa do Wolfric em questão de segundos. Sessão segura na nuvem, painel de controle exclusivo e isolamento total.',
    hero_no_termux: 'Sem Termux nem comandos',
    hero_no_github: 'Sem clonar GitHub',
    hero_no_nodejs: 'Sem instalar Node.js',
    hero_100_web: '100% Pela Web',
    hero_cta_create: 'Vincular meu SubBot Agora',
    hero_cta_login: 'Acessar com meu Número e PIN',
    hero_uptime_desc: 'Instâncias ativas 24/7 sem gastar a bateria do seu celular',
    hero_card1_title: 'Vinculação Instantânea',
    hero_card1_desc: 'Código de 8 dígitos direto no WhatsApp ou leitura de QR Code.',
    hero_card2_title: 'Nuvem Isolada 24/7',
    hero_card2_desc: 'Sua sessão não cai quando você bloqueia o celular ou fica sem internet.',
    hero_card3_title: 'Configurações Próprias',
    hero_card3_desc: 'Prefixo, anti-link, stickers, boas-vindas aos grupos e backups próprios.',
    hero_stat_active: 'SubBots Online',
    hero_stat_total: 'Instâncias Registradas',
    hero_stat_msgs: 'Mensagens Processadas Hoje',

    comp_title: 'Por que o Wolfric SubBot é diferente?',
    comp_subtitle: 'Esqueça servidores caseiros que desligam quando você fecha o aplicativo',
    comp_trad_title: 'O método tradicional e cansativo',
    comp_trad_1: 'Instalar Termux ou Node.js manualmente',
    comp_trad_2: 'Clonar repositórios do GitHub e resolver erros de pacotes',
    comp_trad_3: 'O bot desliga ao bloquear a tela ou se acabar a bateria',
    comp_trad_4: 'Perda total das sessões se limpar os dados do celular',
    comp_wolfric_title: 'Plataforma Oficial Wolfric SubBot',
    comp_wolfric_1: '100% Pela Web sem precisar baixar nada no seu aparelho',
    comp_wolfric_2: 'Vinculação direta por código de 8 dígitos ou QR Code',
    comp_wolfric_3: 'Sessão ativa na nuvem 24/7 sem gastar sua bateria',
    comp_wolfric_4: 'Backups isolados e painel de controle individual',

    create_modal_title: 'Vincular Novo SubBot Wolfric',
    create_modal_step1: '1. Dados do seu WhatsApp',
    create_modal_step2: '2. Vinculação no WhatsApp',
    create_country_label: 'País / Código Telefônico',
    create_phone_label: 'Número de WhatsApp (com DDD)',
    create_phone_placeholder: 'Ex. 11999999999 ou 21988888888',
    create_alias_label: 'Nome ou Apelido do seu SubBot (Opcional)',
    create_alias_placeholder: 'Ex. Lobo Alfa, Meu Bot Wolfric, Clã Wolfric',
    create_method_label: 'Método de Vinculação',
    create_method_code: 'Código de 8 Dígitos (Recomendado)',
    create_method_code_desc: 'Insira o código em Aparelhos conectados > Conectar com número',
    create_method_qr: 'Escanear QR Code',
    create_method_qr_desc: 'Aponte a câmera do WhatsApp para o QR Code na tela',
    create_submit_btn: 'Gerar Código de Vinculação',
    create_submitting: 'Criando instância segura...',
    create_pairing_title: 'Vincule seu WhatsApp agora',
    create_pairing_desc_code:
      'Abra o WhatsApp > Aparelhos conectados > Conectar com número de telefone e digite este código:',
    create_pairing_desc_qr:
      'Abra o WhatsApp > Aparelhos conectados > Conectar um aparelho e aponte para o QR Code:',
    create_copy_code: 'Copiar Código',
    create_copied: 'Copiado!',
    create_qr_placeholder: 'Escaneie este QR Code pelo WhatsApp no seu celular',
    create_qr_step1: '1. Abra o WhatsApp no seu celular',
    create_qr_step2: '2. Toque em Mais opções ou Ajustes > Aparelhos conectados',
    create_qr_step3: '3. Digite o código de 8 dígitos ou escaneie o QR',
    create_pin_warning: 'IMPORTANTE: Seu PIN de acesso para retornar ao painel é:',
    create_confirm_pairing_btn: 'Confirmar e Entrar no Painel',
    create_verifying: 'Verificando conexão...',

    login_modal_title: 'Acessar meu SubBot Wolfric',
    login_modal_subtitle: 'Digite seu número cadastrado e seu PIN de segurança de 4 dígitos',
    login_country_label: 'Código do País',
    login_phone_label: 'Número de WhatsApp (com DDD)',
    login_phone_placeholder: 'Ex. 11999999999 ou 21988888888',
    login_pin_label: 'PIN de Segurança (4 dígitos)',
    login_pin_placeholder: 'Digite seu PIN',
    login_submit_btn: 'Entrar no meu Painel de SubBot',
    login_submitting: 'Verificando credenciais...',
    login_no_bot: 'Ainda não possui um SubBot do Wolfric?',
    login_create_link: 'Crie um novo agora aqui',

    user_status_online: 'Online',
    user_status_offline: 'Desconectado',
    user_status_reconnecting: 'Reconectando...',
    user_status_banned: 'Banido',
    user_status_suspended: 'Suspenso',
    user_uptime: 'Tempo Ativo',
    user_latency: 'Latência Ping',
    user_memory: 'Memória RAM',
    user_groups: 'Grupos Ativos',
    user_restart_btn: 'Reiniciar SubBot',
    user_disconnect_btn: 'Desconectar',
    user_reconnect_btn: 'Reconectar',
    user_relink_btn: 'Reconectar do Zero',
    user_logout_btn: 'Sair da Conta',
    user_tab_controls: 'Status e Comandos',
    user_tab_config: 'Configuração do Bot',
    user_tab_backups: 'Meus Backups',
    user_tab_logs: 'Histórico de Logs',
    user_prefix_label: 'Prefixo dos Comandos',
    user_mode_label: 'Modo de Resposta',
    user_mode_public: 'Público (Todos)',
    user_mode_groups: 'Apenas em Grupos',
    user_mode_private: 'Apenas Chats Privados',
    user_antilink_label: 'Anti-Link Automático',
    user_antispam_label: 'Proteção Anti-Spam',
    user_stickers_label: 'Criador Automático de Figurinhas',
    user_welcome_label: 'Mensagem de Boas-Vindas aos Grupos',
    user_welcome_text_label: 'Texto da Mensagem de Boas-Vindas',
    user_reactions_label: 'Reações Automáticas nos Comandos',
    user_botbio_label: 'Recado / Biografia do Bot no WhatsApp',
    user_save_config_btn: 'Salvar Configurações',
    user_create_backup_btn: 'Criar Backup na Nuvem Agora',
    user_restore_btn: 'Restaurar',
    user_download_backup_btn: 'Baixar Backup',
    user_no_backups: 'Você ainda não possui backups. Crie um para proteger suas configurações.',
    user_no_logs: 'Nenhum evento recente registrado.',
    user_no_subbot_title: 'Nenhum SubBot vinculado no momento',
    user_no_subbot_desc: 'Crie seu primeiro Wolfric SubBot agora em menos de 1 minuto.',
    user_create_subbot_action: 'Criar meu Wolfric SubBot',
    user_login_subbot_action: 'Entrar com PIN',

    owner_locked_title: 'Acesso Administrativo Protegido',
    owner_locked_desc: 'Área de alta segurança exclusiva para o proprietário do Wolfric.',
    owner_input_label: 'Chave Mestra de Segurança',
    owner_input_placeholder: 'Digite a senha de administrador',
    owner_unlock_btn: 'Desbloquear Painel',
    owner_unlocking: 'Autenticando...',
    owner_rate_limit_alert: 'Acesso bloqueado temporariamente por excesso de tentativas. Aguarde 10 minutos.',
    owner_title: 'Painel Privado do Proprietário',
    owner_badge: 'ACESSO RESTRITO',
    owner_desc: 'Supervisão de instâncias, atualizações globais e controle de versões',
    owner_logout: 'Bloquear e Sair',
    owner_tab_instances: 'Instâncias de SubBots',
    owner_tab_versions: 'Versões do Wolfric',
    owner_tab_backups: 'Backups na Nuvem',
    owner_tab_logs: 'Auditoria & Logs',
    owner_tab_settings: 'Limites & Manutenção',
    owner_search_placeholder: 'Pesquisar por telefone ou nome...',
    owner_filter_all: 'Todos',
    owner_filter_online: 'Online',
    owner_filter_offline: 'Desconectados',
    owner_filter_banned: 'Banidos',
    owner_suspend_btn: 'Suspender',
    owner_unsuspend_btn: 'Reativar',
    owner_ban_btn: 'Banir',
    owner_unban_btn: 'Desbanir',
    owner_delete_btn: 'Excluir',
    owner_global_update_btn: 'Atualização Global',
    owner_upload_version_btn: 'Enviar Versão / Backup',
    owner_create_snapshot_btn: 'Criar Snapshot Global',
    owner_maintenance_label: 'Modo Manutenção',
    owner_maintenance_desc: 'Pausa cadastros e exibe aviso público aos usuários.',
    owner_save_settings_btn: 'Salvar Configurações da Plataforma',

    footer_rights: 'Plataforma Oficial Multi-Device para SubBots de Wolfric',
    footer_multi_device: 'Multi-Device Baileys Cloud',
    footer_encryption: 'Sessões com Criptografia de Ponta a Ponta',
    footer_cloud: 'Infraestrutura em Nuvem Dedicada',

    nav_creators_btn: 'Criadores',
    creators_section_badge: 'EQUIPE OFICIAL WOLFRIC',
    creators_section_title: 'Créditos & Desenvolvedores Oficiais',
    creators_section_subtitle: 'Os criadores e mentes brilhantes por trás da plataforma oficial e motor de SubBots do Wolfric.',
    creator_wolfric_role: 'Fundador & Desenvolvedor Principal',
    creator_wolfric_desc: 'Criador original do Wolfric, arquiteto do motor Baileys Multi-Device e lógica de comandos oficial.',
    creator_thel_role: 'Co-Criador & Desenvolvedor Core',
    creator_thel_desc: 'Especialista em segurança de credenciais, otimização de sockets em tempo real e estabilidade.',
    creator_zerrdmc_role: 'Co-Criador & Desenvolvedor',
    creator_zerrdmc_desc: 'Infraestrutura em nuvem, interface de usuário avançada e persistência de dados isolada.',
    creators_copy_btn: 'Copiar Créditos Oficiais',
    creators_copied: 'Créditos copiados para a área de transferência!',
    creators_modal_title: 'Equipe de Desenvolvimento Wolfric',
    creators_command_hint: 'Você também pode ver os criadores digitando .criador ou .creditos no chat do seu SubBot.',
  },

  en: {
    nav_home: 'Home',
    nav_my_subbot: 'My SubBot',
    nav_owner: 'Owner Panel',
    nav_create_btn: 'Create SubBot',
    nav_login_btn: 'Access My Bot',
    nav_maintenance_alert: 'Maintenance in progress',
    nav_active_session: 'SubBot Online',
    nav_lang: 'Language',

    hero_tag: 'High-Availability Multi-Device Engine',
    hero_title_prefix: 'Want to become a',
    hero_title_highlight: 'Wolfric SubBot?',
    hero_subtitle:
      'Turn your own WhatsApp phone number into an active Wolfric instance in seconds. Secure cloud session, exclusive management dashboard, and complete isolation guaranteed.',
    hero_no_termux: 'No Termux or shell commands',
    hero_no_github: 'No GitHub cloning',
    hero_no_nodejs: 'No Node.js setup',
    hero_100_web: '100% Web-Based',
    hero_cta_create: 'Link My SubBot Now',
    hero_cta_login: 'Log In with Phone and PIN',
    hero_uptime_desc: 'Active 24/7 cloud instances without draining your smartphone battery',
    hero_card1_title: 'Instant Linking',
    hero_card1_desc: '8-digit pairing code directly into WhatsApp or visual QR scan.',
    hero_card2_title: '24/7 Cloud Isolation',
    hero_card2_desc: 'Your session stays alive even if your phone locks or loses Wi-Fi.',
    hero_card3_title: 'Custom Settings',
    hero_card3_desc: 'Prefix, anti-link, sticker maker, group welcomes, and cloud backups.',
    hero_stat_active: 'SubBots Online',
    hero_stat_total: 'Registered Instances',
    hero_stat_msgs: 'Messages Processed Today',

    comp_title: 'Why is Wolfric SubBot different?',
    comp_subtitle: 'Say goodbye to homebrew bots that shut down whenever you close the app',
    comp_trad_title: 'The tedious legacy method',
    comp_trad_1: 'Manually installing Termux or Node.js',
    comp_trad_2: 'Cloning GitHub repositories and dealing with package errors',
    comp_trad_3: 'Bot dies whenever your phone locks or runs out of battery',
    comp_trad_4: 'Total data loss whenever mobile browser cache is cleared',
    comp_wolfric_title: 'Official Wolfric SubBot Platform',
    comp_wolfric_1: '100% Web-based without downloading anything to your phone',
    comp_wolfric_2: 'Direct linking using an 8-digit pairing code or QR Code',
    comp_wolfric_3: 'Active 24/7 cloud session without draining phone battery',
    comp_wolfric_4: 'Isolated backups and dedicated self-service control panel',

    create_modal_title: 'Link New Wolfric SubBot',
    create_modal_step1: '1. Your WhatsApp Details',
    create_modal_step2: '2. WhatsApp Linking',
    create_country_label: 'Country / Phone Code',
    create_phone_label: 'WhatsApp Phone Number',
    create_phone_placeholder: 'e.g. 5511999999999 or 34612345678',
    create_alias_label: 'SubBot Name or Alias (Optional)',
    create_alias_placeholder: 'e.g. Alpha Wolf, My Bot, Wolfric Clan',
    create_method_label: 'Pairing Method',
    create_method_code: '8-Digit Pairing Code (Recommended)',
    create_method_code_desc: 'Enter the code in Linked Devices > Link with phone number',
    create_method_qr: 'Scan QR Code',
    create_method_qr_desc: 'Scan the on-screen QR Code using your WhatsApp camera',
    create_submit_btn: 'Generate Pairing Code',
    create_submitting: 'Provisioning secure instance...',
    create_pairing_title: 'Pair your WhatsApp now',
    create_pairing_desc_code:
      'Open WhatsApp > Linked Devices > Link with phone number and enter this code:',
    create_pairing_desc_qr:
      'Open WhatsApp > Linked Devices > Link a device and scan this QR code:',
    create_copy_code: 'Copy Code',
    create_copied: 'Copied!',
    create_qr_placeholder: 'Scan this QR code from WhatsApp on your mobile phone',
    create_qr_step1: '1. Open WhatsApp on your phone',
    create_qr_step2: '2. Tap Menu or Settings > Linked devices',
    create_qr_step3: '3. Enter the 8-digit code or scan the QR Code',
    create_pin_warning: 'IMPORTANT: Your 4-digit PIN to re-access this dashboard is:',
    create_confirm_pairing_btn: 'Confirm and Open Dashboard',
    create_verifying: 'Verifying pairing...',

    login_modal_title: 'Access My Wolfric SubBot',
    login_modal_subtitle: 'Enter your registered phone number and 4-digit security PIN',
    login_country_label: 'Country Code',
    login_phone_label: 'WhatsApp Phone Number',
    login_phone_placeholder: 'e.g. 5511999999999 or 34612345678',
    login_pin_label: 'Security PIN (4 digits)',
    login_pin_placeholder: 'Enter your PIN',
    login_submit_btn: 'Open SubBot Dashboard',
    login_submitting: 'Verifying credentials...',
    login_no_bot: "Don't have a Wolfric SubBot yet?",
    login_create_link: 'Create a new one here',

    user_status_online: 'Online',
    user_status_offline: 'Offline',
    user_status_reconnecting: 'Reconnecting...',
    user_status_banned: 'Banned',
    user_status_suspended: 'Suspended',
    user_uptime: 'Uptime',
    user_latency: 'Ping Latency',
    user_memory: 'RAM Memory',
    user_groups: 'Active Groups',
    user_restart_btn: 'Restart SubBot',
    user_disconnect_btn: 'Disconnect',
    user_reconnect_btn: 'Reconnect',
    user_relink_btn: 'Relink SubBot',
    user_logout_btn: 'Log Out',
    user_tab_controls: 'Status & Controls',
    user_tab_config: 'Bot Configuration',
    user_tab_backups: 'My Cloud Backups',
    user_tab_logs: 'Event History',
    user_prefix_label: 'Command Prefix',
    user_mode_label: 'Response Mode',
    user_mode_public: 'Public (Everyone)',
    user_mode_groups: 'Groups Only',
    user_mode_private: 'Private Chats Only',
    user_antilink_label: 'Automatic Anti-Link',
    user_antispam_label: 'Anti-Spam Shield',
    user_stickers_label: 'Automatic Sticker Maker',
    user_welcome_label: 'Group Welcome Message',
    user_welcome_text_label: 'Welcome Message Text',
    user_reactions_label: 'Automatic Command Reactions',
    user_botbio_label: 'Bot Status / Bio on WhatsApp',
    user_save_config_btn: 'Save Configuration',
    user_create_backup_btn: 'Create Cloud Backup Now',
    user_restore_btn: 'Restore',
    user_download_backup_btn: 'Download Backup',
    user_no_backups: 'You have no backups yet. Create one to safeguard your preferences.',
    user_no_logs: 'No recent events recorded.',
    user_no_subbot_title: 'No SubBot linked at this time',
    user_no_subbot_desc: 'Create your first Wolfric SubBot now in less than 1 minute.',
    user_create_subbot_action: 'Create my Wolfric SubBot',
    user_login_subbot_action: 'Log In with PIN',

    owner_locked_title: 'Protected Administrative Gate',
    owner_locked_desc: 'High-security restricted area exclusively for the Wolfric platform owner.',
    owner_input_label: 'Master Security Key',
    owner_input_placeholder: 'Enter authorized administrator key',
    owner_unlock_btn: 'Unlock Dashboard',
    owner_unlocking: 'Authenticating...',
    owner_rate_limit_alert: 'Access temporarily locked due to repeated failed attempts. Please wait 10 minutes.',
    owner_title: 'Private Owner Dashboard',
    owner_badge: 'RESTRICTED ACCESS',
    owner_desc: 'Global monitoring, instance management, global rollouts, and versions',
    owner_logout: 'Lock & Exit',
    owner_tab_instances: 'SubBot Instances',
    owner_tab_versions: 'Wolfric Versions',
    owner_tab_backups: 'Cloud Backups',
    owner_tab_logs: 'Audit & System Logs',
    owner_tab_settings: 'Limits & Maintenance',
    owner_search_placeholder: 'Search by phone number or name...',
    owner_filter_all: 'All',
    owner_filter_online: 'Online',
    owner_filter_offline: 'Offline',
    owner_filter_banned: 'Banned',
    owner_suspend_btn: 'Suspend',
    owner_unsuspend_btn: 'Reactivate',
    owner_ban_btn: 'Ban',
    owner_unban_btn: 'Unban',
    owner_delete_btn: 'Delete',
    owner_global_update_btn: 'Global Update',
    owner_upload_version_btn: 'Upload Version / Backup',
    owner_create_snapshot_btn: 'Create Global Snapshot',
    owner_maintenance_label: 'Maintenance Mode',
    owner_maintenance_desc: 'Pauses registrations and displays public notice to users.',
    owner_save_settings_btn: 'Save Platform Settings',

    footer_rights: 'Official Multi-Device Platform for Wolfric SubBots',
    footer_multi_device: 'Multi-Device Baileys Cloud',
    footer_encryption: 'End-to-End Encrypted Sessions',
    footer_cloud: 'Dedicated Cloud Infrastructure',

    nav_creators_btn: 'Creators',
    creators_section_badge: 'OFFICIAL WOLFRIC TEAM',
    creators_section_title: 'Official Creators & Engineering Team',
    creators_section_subtitle: 'The creators and masterminds behind the official Wolfric platform and SubBot engine.',
    creator_wolfric_role: 'Founder & Lead Developer',
    creator_wolfric_desc: 'Original creator of Wolfric, architect of the Baileys Multi-Device engine and command ecosystem.',
    creator_thel_role: 'Co-Creator & Core Developer',
    creator_thel_desc: 'Credential isolation specialist, real-time socket optimization, and instance security.',
    creator_zerrdmc_role: 'Co-Creator & Developer',
    creator_zerrdmc_desc: 'Cloud infrastructure deployment, responsive UI architecture, and secure persistence storage.',
    creators_copy_btn: 'Copy Official Credits',
    creators_copied: 'Official credits copied to clipboard!',
    creators_modal_title: 'Wolfric Development Team',
    creators_command_hint: 'You can also check the creators anytime by sending .creador or .creditos in any SubBot chat.',
  },
};
