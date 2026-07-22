const CARD_TYPE = "vikunja-todo-card";
const STORAGE_PREFIX = "vikunja-todo-card:selected:";
const TRANSLATION_KEYS = [
  "allProjects", "allCategories", "uncategorised", "createProject", "deleteProject",
  "selectProject", "createCategory", "deleteCategory", "selectCategory", "refresh",
  "taskTitle", "selectProjectToAdd", "addTask", "selectAll", "selected", "filterTasks",
  "project", "categories", "moveToProject", "chooseCategories", "noCategories",
  "addCategories", "removeCategories", "taskActions", "markComplete", "markActive",
  "copyAsText", "deleteTasks", "loading", "noActive", "completed", "noCompleted",
  "selectTask", "editTask", "addPhoto", "addVideo", "chooseFiles", "copied",
  "newProjectName", "newCategoryName",
];
const TRANSLATION_VALUES = {
  en: ["All projects", "All categories", "Uncategorised", "Create project", "Delete selected project", "Select project", "Create category", "Delete selected category", "Select category", "Refresh", "Task title", "Select a project to add a task", "Add task", "Select all", "selected", "Filter task titles", "Project", "Categories", "Move to project", "Choose categories", "No categories available.", "Add categories", "Remove categories", "Task actions", "Mark complete", "Mark active", "Copy as text", "Delete tasks", "Loading Vikunja Task Hub…", "No active tasks.", "Completed", "No completed tasks.", "Select task", "Edit task", "Add photo", "Add video", "Choose files", "Copied", "New project name", "New category name"],
  es: ["Todos los proyectos", "Todas las categorías", "Sin categoría", "Crear proyecto", "Eliminar proyecto seleccionado", "Seleccionar proyecto", "Crear categoría", "Eliminar categoría seleccionada", "Seleccionar categoría", "Actualizar", "Título de la tarea", "Selecciona un proyecto para añadir una tarea", "Añadir tarea", "Seleccionar todo", "seleccionadas", "Filtrar títulos de tareas", "Proyecto", "Categorías", "Mover al proyecto", "Elegir categorías", "No hay categorías disponibles.", "Añadir categorías", "Quitar categorías", "Acciones de tareas", "Marcar como completada", "Marcar como activa", "Copiar como texto", "Eliminar tareas", "Cargando Vikunja Task Hub…", "No hay tareas activas.", "Completadas", "No hay tareas completadas.", "Seleccionar tarea", "Editar tarea", "Añadir foto", "Añadir vídeo", "Elegir archivos", "Copiado", "Nombre del nuevo proyecto", "Nombre de la nueva categoría"],
  fr: ["Tous les projets", "Toutes les catégories", "Sans catégorie", "Créer un projet", "Supprimer le projet sélectionné", "Sélectionner un projet", "Créer une catégorie", "Supprimer la catégorie sélectionnée", "Sélectionner une catégorie", "Actualiser", "Titre de la tâche", "Sélectionnez un projet pour ajouter une tâche", "Ajouter une tâche", "Tout sélectionner", "sélectionnées", "Filtrer les titres", "Projet", "Catégories", "Déplacer vers le projet", "Choisir des catégories", "Aucune catégorie disponible.", "Ajouter des catégories", "Retirer des catégories", "Actions sur les tâches", "Marquer terminée", "Marquer active", "Copier comme texte", "Supprimer les tâches", "Chargement de Vikunja Task Hub…", "Aucune tâche active.", "Terminées", "Aucune tâche terminée.", "Sélectionner la tâche", "Modifier la tâche", "Ajouter une photo", "Ajouter une vidéo", "Choisir des fichiers", "Copié", "Nom du nouveau projet", "Nom de la nouvelle catégorie"],
  de: ["Alle Projekte", "Alle Kategorien", "Ohne Kategorie", "Projekt erstellen", "Ausgewähltes Projekt löschen", "Projekt auswählen", "Kategorie erstellen", "Ausgewählte Kategorie löschen", "Kategorie auswählen", "Aktualisieren", "Aufgabentitel", "Projekt auswählen, um eine Aufgabe hinzuzufügen", "Aufgabe hinzufügen", "Alle auswählen", "ausgewählt", "Aufgabentitel filtern", "Projekt", "Kategorien", "In Projekt verschieben", "Kategorien auswählen", "Keine Kategorien verfügbar.", "Kategorien hinzufügen", "Kategorien entfernen", "Aufgabenaktionen", "Als erledigt markieren", "Als aktiv markieren", "Als Text kopieren", "Aufgaben löschen", "Vikunja Task Hub wird geladen…", "Keine aktiven Aufgaben.", "Erledigt", "Keine erledigten Aufgaben.", "Aufgabe auswählen", "Aufgabe bearbeiten", "Foto hinzufügen", "Video hinzufügen", "Dateien auswählen", "Kopiert", "Name des neuen Projekts", "Name der neuen Kategorie"],
  ru: ["Все проекты", "Все категории", "Без категории", "Создать проект", "Удалить выбранный проект", "Выбрать проект", "Создать категорию", "Удалить выбранную категорию", "Выбрать категорию", "Обновить", "Название задачи", "Выберите проект, чтобы добавить задачу", "Добавить задачу", "Выбрать все", "выбрано", "Фильтр задач", "Проект", "Категории", "Переместить в проект", "Выбрать категории", "Нет доступных категорий.", "Добавить категории", "Удалить категории", "Действия с задачами", "Отметить выполненной", "Отметить активной", "Копировать как текст", "Удалить задачи", "Загрузка Vikunja Task Hub…", "Нет активных задач.", "Выполненные", "Нет выполненных задач.", "Выбрать задачу", "Изменить задачу", "Добавить фото", "Добавить видео", "Выбрать файлы", "Скопировано", "Название нового проекта", "Название новой категории"],
  zh: ["所有项目", "所有分类", "未分类", "创建项目", "删除所选项目", "选择项目", "创建分类", "删除所选分类", "选择分类", "刷新", "任务标题", "选择项目以添加任务", "添加任务", "全选", "已选择", "筛选任务标题", "项目", "分类", "移动到项目", "选择分类", "没有可用分类。", "添加分类", "移除分类", "任务操作", "标记为完成", "标记为活动", "复制为文本", "删除任务", "正在加载 Vikunja Task Hub…", "没有活动任务。", "已完成", "没有已完成任务。", "选择任务", "编辑任务", "添加照片", "添加视频", "选择文件", "已复制", "新项目名称", "新分类名称"],
  hi: ["सभी प्रोजेक्ट", "सभी श्रेणियाँ", "बिना श्रेणी", "प्रोजेक्ट बनाएँ", "चुना प्रोजेक्ट हटाएँ", "प्रोजेक्ट चुनें", "श्रेणी बनाएँ", "चुनी श्रेणी हटाएँ", "श्रेणी चुनें", "रीफ़्रेश", "कार्य शीर्षक", "कार्य जोड़ने के लिए प्रोजेक्ट चुनें", "कार्य जोड़ें", "सभी चुनें", "चयनित", "कार्य शीर्षक फ़िल्टर करें", "प्रोजेक्ट", "श्रेणियाँ", "प्रोजेक्ट में ले जाएँ", "श्रेणियाँ चुनें", "कोई श्रेणी उपलब्ध नहीं।", "श्रेणियाँ जोड़ें", "श्रेणियाँ हटाएँ", "कार्य क्रियाएँ", "पूर्ण चिह्नित करें", "सक्रिय चिह्नित करें", "टेक्स्ट के रूप में कॉपी करें", "कार्य हटाएँ", "Vikunja Task Hub लोड हो रहा है…", "कोई सक्रिय कार्य नहीं।", "पूर्ण", "कोई पूर्ण कार्य नहीं।", "कार्य चुनें", "कार्य संपादित करें", "फ़ोटो जोड़ें", "वीडियो जोड़ें", "फ़ाइलें चुनें", "कॉपी किया गया", "नए प्रोजेक्ट का नाम", "नई श्रेणी का नाम"],
  ar: ["كل المشاريع", "كل الفئات", "غير مصنف", "إنشاء مشروع", "حذف المشروع المحدد", "اختيار مشروع", "إنشاء فئة", "حذف الفئة المحددة", "اختيار فئة", "تحديث", "عنوان المهمة", "اختر مشروعًا لإضافة مهمة", "إضافة مهمة", "تحديد الكل", "محدد", "تصفية عناوين المهام", "المشروع", "الفئات", "نقل إلى مشروع", "اختيار الفئات", "لا توجد فئات متاحة.", "إضافة فئات", "إزالة فئات", "إجراءات المهام", "وضع علامة مكتملة", "وضع علامة نشطة", "نسخ كنص", "حذف المهام", "جارٍ تحميل Vikunja Task Hub…", "لا توجد مهام نشطة.", "مكتملة", "لا توجد مهام مكتملة.", "اختيار المهمة", "تحرير المهمة", "إضافة صورة", "إضافة فيديو", "اختيار ملفات", "تم النسخ", "اسم المشروع الجديد", "اسم الفئة الجديدة"],
  bn: ["সব প্রকল্প", "সব বিভাগ", "বিভাগহীন", "প্রকল্প তৈরি করুন", "নির্বাচিত প্রকল্প মুছুন", "প্রকল্প নির্বাচন করুন", "বিভাগ তৈরি করুন", "নির্বাচিত বিভাগ মুছুন", "বিভাগ নির্বাচন করুন", "রিফ্রেশ", "কাজের শিরোনাম", "কাজ যোগ করতে প্রকল্প নির্বাচন করুন", "কাজ যোগ করুন", "সব নির্বাচন করুন", "নির্বাচিত", "কাজের শিরোনাম ফিল্টার করুন", "প্রকল্প", "বিভাগ", "প্রকল্পে সরান", "বিভাগ নির্বাচন করুন", "কোনো বিভাগ নেই।", "বিভাগ যোগ করুন", "বিভাগ সরান", "কাজের ক্রিয়া", "সম্পন্ন চিহ্নিত করুন", "সক্রিয় চিহ্নিত করুন", "টেক্সট হিসেবে কপি করুন", "কাজ মুছুন", "Vikunja Task Hub লোড হচ্ছে…", "কোনো সক্রিয় কাজ নেই।", "সম্পন্ন", "কোনো সম্পন্ন কাজ নেই।", "কাজ নির্বাচন করুন", "কাজ সম্পাদনা করুন", "ছবি যোগ করুন", "ভিডিও যোগ করুন", "ফাইল নির্বাচন করুন", "কপি হয়েছে", "নতুন প্রকল্পের নাম", "নতুন বিভাগের নাম"],
  pt: ["Todos os projetos", "Todas as categorias", "Sem categoria", "Criar projeto", "Excluir projeto selecionado", "Selecionar projeto", "Criar categoria", "Excluir categoria selecionada", "Selecionar categoria", "Atualizar", "Título da tarefa", "Selecione um projeto para adicionar uma tarefa", "Adicionar tarefa", "Selecionar tudo", "selecionadas", "Filtrar títulos das tarefas", "Projeto", "Categorias", "Mover para o projeto", "Escolher categorias", "Nenhuma categoria disponível.", "Adicionar categorias", "Remover categorias", "Ações de tarefas", "Marcar como concluída", "Marcar como ativa", "Copiar como texto", "Excluir tarefas", "Carregando Vikunja Task Hub…", "Nenhuma tarefa ativa.", "Concluídas", "Nenhuma tarefa concluída.", "Selecionar tarefa", "Editar tarefa", "Adicionar foto", "Adicionar vídeo", "Escolher arquivos", "Copiado", "Nome do novo projeto", "Nome da nova categoria"],
  id: ["Semua proyek", "Semua kategori", "Tanpa kategori", "Buat proyek", "Hapus proyek terpilih", "Pilih proyek", "Buat kategori", "Hapus kategori terpilih", "Pilih kategori", "Muat ulang", "Judul tugas", "Pilih proyek untuk menambahkan tugas", "Tambah tugas", "Pilih semua", "dipilih", "Saring judul tugas", "Proyek", "Kategori", "Pindahkan ke proyek", "Pilih kategori", "Tidak ada kategori tersedia.", "Tambah kategori", "Hapus kategori", "Tindakan tugas", "Tandai selesai", "Tandai aktif", "Salin sebagai teks", "Hapus tugas", "Memuat Vikunja Task Hub…", "Tidak ada tugas aktif.", "Selesai", "Tidak ada tugas selesai.", "Pilih tugas", "Edit tugas", "Tambah foto", "Tambah video", "Pilih berkas", "Disalin", "Nama proyek baru", "Nama kategori baru"],
  ur: ["تمام پروجیکٹس", "تمام زمرے", "بغیر زمرہ", "پروجیکٹ بنائیں", "منتخب پروجیکٹ حذف کریں", "پروجیکٹ منتخب کریں", "زمرہ بنائیں", "منتخب زمرہ حذف کریں", "زمرہ منتخب کریں", "تازہ کریں", "کام کا عنوان", "کام شامل کرنے کے لیے پروجیکٹ منتخب کریں", "کام شامل کریں", "سب منتخب کریں", "منتخب", "کام کے عنوانات فلٹر کریں", "پروجیکٹ", "زمرے", "پروجیکٹ میں منتقل کریں", "زمرے منتخب کریں", "کوئی زمرہ دستیاب نہیں۔", "زمرے شامل کریں", "زمرے ہٹائیں", "کام کی کارروائیاں", "مکمل نشان لگائیں", "فعال نشان لگائیں", "متن کے طور پر کاپی کریں", "کام حذف کریں", "Vikunja Task Hub لوڈ ہو رہا ہے…", "کوئی فعال کام نہیں۔", "مکمل", "کوئی مکمل کام نہیں۔", "کام منتخب کریں", "کام میں ترمیم کریں", "تصویر شامل کریں", "ویڈیو شامل کریں", "فائلیں منتخب کریں", "کاپی ہو گیا", "نئے پروجیکٹ کا نام", "نئے زمرے کا نام"],
  uk: ["Усі проєкти", "Усі категорії", "Без категорії", "Створити проєкт", "Видалити вибраний проєкт", "Вибрати проєкт", "Створити категорію", "Видалити вибрану категорію", "Вибрати категорію", "Оновити", "Назва завдання", "Виберіть проєкт, щоб додати завдання", "Додати завдання", "Вибрати все", "вибрано", "Фільтрувати назви завдань", "Проєкт", "Категорії", "Перемістити до проєкту", "Вибрати категорії", "Немає доступних категорій.", "Додати категорії", "Видалити категорії", "Дії із завданнями", "Позначити виконаним", "Позначити активним", "Копіювати як текст", "Видалити завдання", "Завантаження Vikunja Task Hub…", "Немає активних завдань.", "Виконані", "Немає виконаних завдань.", "Вибрати завдання", "Редагувати завдання", "Додати фото", "Додати відео", "Вибрати файли", "Скопійовано", "Назва нового проєкту", "Назва нової категорії"],
  it: ["Tutti i progetti", "Tutte le categorie", "Senza categoria", "Crea progetto", "Elimina il progetto selezionato", "Seleziona progetto", "Crea categoria", "Elimina la categoria selezionata", "Seleziona categoria", "Aggiorna", "Titolo dell'attività", "Seleziona un progetto per aggiungere un'attività", "Aggiungi attività", "Seleziona tutto", "selezionate", "Filtra i titoli delle attività", "Progetto", "Categorie", "Sposta nel progetto", "Scegli categorie", "Nessuna categoria disponibile.", "Aggiungi categorie", "Rimuovi categorie", "Azioni attività", "Segna come completata", "Segna come attiva", "Copia come testo", "Elimina attività", "Caricamento di Vikunja Task Hub…", "Nessuna attività attiva.", "Completate", "Nessuna attività completata.", "Seleziona attività", "Modifica attività", "Aggiungi foto", "Aggiungi video", "Scegli file", "Copiato", "Nome del nuovo progetto", "Nome della nuova categoria"],
  el: ["Όλα τα έργα", "Όλες οι κατηγορίες", "Χωρίς κατηγορία", "Δημιουργία έργου", "Διαγραφή επιλεγμένου έργου", "Επιλογή έργου", "Δημιουργία κατηγορίας", "Διαγραφή επιλεγμένης κατηγορίας", "Επιλογή κατηγορίας", "Ανανέωση", "Τίτλος εργασίας", "Επιλέξτε έργο για να προσθέσετε εργασία", "Προσθήκη εργασίας", "Επιλογή όλων", "επιλεγμένες", "Φιλτράρισμα τίτλων εργασιών", "Έργο", "Κατηγορίες", "Μετακίνηση στο έργο", "Επιλογή κατηγοριών", "Δεν υπάρχουν διαθέσιμες κατηγορίες.", "Προσθήκη κατηγοριών", "Αφαίρεση κατηγοριών", "Ενέργειες εργασιών", "Σήμανση ως ολοκληρωμένη", "Σήμανση ως ενεργή", "Αντιγραφή ως κείμενο", "Διαγραφή εργασιών", "Φόρτωση Vikunja Task Hub…", "Δεν υπάρχουν ενεργές εργασίες.", "Ολοκληρωμένες", "Δεν υπάρχουν ολοκληρωμένες εργασίες.", "Επιλογή εργασίας", "Επεξεργασία εργασίας", "Προσθήκη φωτογραφίας", "Προσθήκη βίντεο", "Επιλογή αρχείων", "Αντιγράφηκε", "Όνομα νέου έργου", "Όνομα νέας κατηγορίας"],
  sr: ["Сви пројекти", "Све категорије", "Без категорије", "Направи пројекат", "Обриши изабрани пројекат", "Изабери пројекат", "Направи категорију", "Обриши изабрану категорију", "Изабери категорију", "Освежи", "Наслов задатка", "Изаберите пројекат за додавање задатка", "Додај задатак", "Изабери све", "изабрано", "Филтрирај наслове задатака", "Пројекат", "Категорије", "Премести у пројекат", "Изабери категорије", "Нема доступних категорија.", "Додај категорије", "Уклони категорије", "Радње са задацима", "Означи као завршен", "Означи као активан", "Копирај као текст", "Обриши задатке", "Учитавање Vikunja Task Hub-а…", "Нема активних задатака.", "Завршени", "Нема завршених задатака.", "Изабери задатак", "Измени задатак", "Додај фотографију", "Додај видео", "Изабери датотеке", "Копирано", "Назив новог пројекта", "Назив нове категорије"],
  hu: ["Minden projekt", "Minden kategória", "Kategória nélkül", "Projekt létrehozása", "Kijelölt projekt törlése", "Projekt kiválasztása", "Kategória létrehozása", "Kijelölt kategória törlése", "Kategória kiválasztása", "Frissítés", "Feladat címe", "Válassz projektet a feladat hozzáadásához", "Feladat hozzáadása", "Összes kijelölése", "kijelölve", "Feladatcímek szűrése", "Projekt", "Kategóriák", "Áthelyezés projektbe", "Kategóriák kiválasztása", "Nincs elérhető kategória.", "Kategóriák hozzáadása", "Kategóriák eltávolítása", "Feladatműveletek", "Megjelölés késznek", "Megjelölés aktívnak", "Másolás szövegként", "Feladatok törlése", "A Vikunja Task Hub betöltése…", "Nincsenek aktív feladatok.", "Elkészült", "Nincsenek befejezett feladatok.", "Feladat kiválasztása", "Feladat szerkesztése", "Fénykép hozzáadása", "Videó hozzáadása", "Fájlok kiválasztása", "Másolva", "Új projekt neve", "Új kategória neve"],
  ro: ["Toate proiectele", "Toate categoriile", "Fără categorie", "Creează proiect", "Șterge proiectul selectat", "Selectează proiectul", "Creează categorie", "Șterge categoria selectată", "Selectează categoria", "Reîmprospătează", "Titlul sarcinii", "Selectează un proiect pentru a adăuga o sarcină", "Adaugă sarcină", "Selectează tot", "selectate", "Filtrează titlurile sarcinilor", "Proiect", "Categorii", "Mută în proiect", "Alege categorii", "Nu există categorii disponibile.", "Adaugă categorii", "Elimină categorii", "Acțiuni pentru sarcini", "Marchează ca finalizată", "Marchează ca activă", "Copiază ca text", "Șterge sarcini", "Se încarcă Vikunja Task Hub…", "Nu există sarcini active.", "Finalizate", "Nu există sarcini finalizate.", "Selectează sarcina", "Editează sarcina", "Adaugă fotografie", "Adaugă videoclip", "Alege fișiere", "Copiat", "Numele noului proiect", "Numele noii categorii"],
  ga: ["Gach tionscadal", "Gach catagóir", "Gan chatagóir", "Cruthaigh tionscadal", "Scrios an tionscadal roghnaithe", "Roghnaigh tionscadal", "Cruthaigh catagóir", "Scrios an chatagóir roghnaithe", "Roghnaigh catagóir", "Athnuaigh", "Teideal an taisc", "Roghnaigh tionscadal chun tasc a chur leis", "Cuir tasc leis", "Roghnaigh uile", "roghnaithe", "Scag teidil tascanna", "Tionscadal", "Catagóirí", "Bog go tionscadal", "Roghnaigh catagóirí", "Níl aon chatagóirí ar fáil.", "Cuir catagóirí leis", "Bain catagóirí", "Gníomhartha tascanna", "Marcáil críochnaithe", "Marcáil gníomhach", "Cóipeáil mar théacs", "Scrios tascanna", "Vikunja Task Hub á lódáil…", "Níl aon tascanna gníomhacha ann.", "Críochnaithe", "Níl aon tascanna críochnaithe ann.", "Roghnaigh tasc", "Cuir tasc in eagar", "Cuir grianghraf leis", "Cuir físeán leis", "Roghnaigh comhaid", "Cóipeáilte", "Ainm an tionscadail nua", "Ainm na catagóire nua"],
  pl: ["Wszystkie projekty", "Wszystkie kategorie", "Bez kategorii", "Utwórz projekt", "Usuń wybrany projekt", "Wybierz projekt", "Utwórz kategorię", "Usuń wybraną kategorię", "Wybierz kategorię", "Odśwież", "Tytuł zadania", "Wybierz projekt, aby dodać zadanie", "Dodaj zadanie", "Zaznacz wszystko", "zaznaczono", "Filtruj tytuły zadań", "Projekt", "Kategorie", "Przenieś do projektu", "Wybierz kategorie", "Brak dostępnych kategorii.", "Dodaj kategorie", "Usuń kategorie", "Działania na zadaniach", "Oznacz jako ukończone", "Oznacz jako aktywne", "Kopiuj jako tekst", "Usuń zadania", "Ładowanie Vikunja Task Hub…", "Brak aktywnych zadań.", "Ukończone", "Brak ukończonych zadań.", "Wybierz zadanie", "Edytuj zadanie", "Dodaj zdjęcie", "Dodaj film", "Wybierz pliki", "Skopiowano", "Nazwa nowego projektu", "Nazwa nowej kategorii"],
  nl: ["Alle projecten", "Alle categorieën", "Zonder categorie", "Project maken", "Geselecteerd project verwijderen", "Project selecteren", "Categorie maken", "Geselecteerde categorie verwijderen", "Categorie selecteren", "Vernieuwen", "Taaktitel", "Selecteer een project om een taak toe te voegen", "Taak toevoegen", "Alles selecteren", "geselecteerd", "Taaktitels filteren", "Project", "Categorieën", "Naar project verplaatsen", "Categorieën kiezen", "Geen categorieën beschikbaar.", "Categorieën toevoegen", "Categorieën verwijderen", "Taakacties", "Als voltooid markeren", "Als actief markeren", "Kopiëren als tekst", "Taken verwijderen", "Vikunja Task Hub laden…", "Geen actieve taken.", "Voltooid", "Geen voltooide taken.", "Taak selecteren", "Taak bewerken", "Foto toevoegen", "Video toevoegen", "Bestanden kiezen", "Gekopieerd", "Naam van nieuw project", "Naam van nieuwe categorie"],
  tr: ["Tüm projeler", "Tüm kategoriler", "Kategorisiz", "Proje oluştur", "Seçili projeyi sil", "Proje seç", "Kategori oluştur", "Seçili kategoriyi sil", "Kategori seç", "Yenile", "Görev başlığı", "Görev eklemek için bir proje seçin", "Görev ekle", "Tümünü seç", "seçildi", "Görev başlıklarını filtrele", "Proje", "Kategoriler", "Projeye taşı", "Kategorileri seç", "Kullanılabilir kategori yok.", "Kategori ekle", "Kategorileri kaldır", "Görev işlemleri", "Tamamlandı olarak işaretle", "Etkin olarak işaretle", "Metin olarak kopyala", "Görevleri sil", "Vikunja Task Hub yükleniyor…", "Etkin görev yok.", "Tamamlandı", "Tamamlanmış görev yok.", "Görev seç", "Görevi düzenle", "Fotoğraf ekle", "Video ekle", "Dosya seç", "Kopyalandı", "Yeni proje adı", "Yeni kategori adı"],
  fa: ["همه پروژه‌ها", "همه دسته‌ها", "بدون دسته", "ایجاد پروژه", "حذف پروژه انتخاب‌شده", "انتخاب پروژه", "ایجاد دسته", "حذف دسته انتخاب‌شده", "انتخاب دسته", "تازه‌سازی", "عنوان وظیفه", "برای افزودن وظیفه یک پروژه انتخاب کنید", "افزودن وظیفه", "انتخاب همه", "انتخاب‌شده", "فیلتر عنوان وظایف", "پروژه", "دسته‌ها", "انتقال به پروژه", "انتخاب دسته‌ها", "دسته‌ای موجود نیست.", "افزودن دسته‌ها", "حذف دسته‌ها", "عملیات وظایف", "علامت‌گذاری به‌عنوان انجام‌شده", "علامت‌گذاری به‌عنوان فعال", "کپی به‌صورت متن", "حذف وظایف", "در حال بارگذاری Vikunja Task Hub…", "وظیفه فعالی وجود ندارد.", "انجام‌شده", "وظیفه انجام‌شده‌ای وجود ندارد.", "انتخاب وظیفه", "ویرایش وظیفه", "افزودن عکس", "افزودن ویدیو", "انتخاب فایل‌ها", "کپی شد", "نام پروژه جدید", "نام دسته جدید"],
  ja: ["すべてのプロジェクト", "すべてのカテゴリー", "カテゴリーなし", "プロジェクトを作成", "選択したプロジェクトを削除", "プロジェクトを選択", "カテゴリーを作成", "選択したカテゴリーを削除", "カテゴリーを選択", "更新", "タスク名", "タスクを追加するプロジェクトを選択", "タスクを追加", "すべて選択", "件選択", "タスク名を絞り込む", "プロジェクト", "カテゴリー", "プロジェクトへ移動", "カテゴリーを選択", "利用可能なカテゴリーはありません。", "カテゴリーを追加", "カテゴリーを削除", "タスク操作", "完了にする", "未完了に戻す", "テキストとしてコピー", "タスクを削除", "Vikunja Task Hub を読み込み中…", "アクティブなタスクはありません。", "完了済み", "完了済みのタスクはありません。", "タスクを選択", "タスクを編集", "写真を追加", "動画を追加", "ファイルを選択", "コピーしました", "新しいプロジェクト名", "新しいカテゴリー名"],
  ko: ["모든 프로젝트", "모든 카테고리", "카테고리 없음", "프로젝트 만들기", "선택한 프로젝트 삭제", "프로젝트 선택", "카테고리 만들기", "선택한 카테고리 삭제", "카테고리 선택", "새로 고침", "작업 제목", "작업을 추가할 프로젝트를 선택하세요", "작업 추가", "모두 선택", "개 선택됨", "작업 제목 필터", "프로젝트", "카테고리", "프로젝트로 이동", "카테고리 선택", "사용 가능한 카테고리가 없습니다.", "카테고리 추가", "카테고리 제거", "작업 동작", "완료로 표시", "활성으로 표시", "텍스트로 복사", "작업 삭제", "Vikunja Task Hub 불러오는 중…", "활성 작업이 없습니다.", "완료됨", "완료된 작업이 없습니다.", "작업 선택", "작업 편집", "사진 추가", "동영상 추가", "파일 선택", "복사됨", "새 프로젝트 이름", "새 카테고리 이름"],
  vi: ["Tất cả dự án", "Tất cả danh mục", "Chưa phân loại", "Tạo dự án", "Xóa dự án đã chọn", "Chọn dự án", "Tạo danh mục", "Xóa danh mục đã chọn", "Chọn danh mục", "Làm mới", "Tiêu đề công việc", "Chọn dự án để thêm công việc", "Thêm công việc", "Chọn tất cả", "đã chọn", "Lọc tiêu đề công việc", "Dự án", "Danh mục", "Chuyển sang dự án", "Chọn danh mục", "Không có danh mục nào.", "Thêm danh mục", "Xóa danh mục", "Thao tác công việc", "Đánh dấu hoàn thành", "Đánh dấu đang hoạt động", "Sao chép dạng văn bản", "Xóa công việc", "Đang tải Vikunja Task Hub…", "Không có công việc đang hoạt động.", "Đã hoàn thành", "Không có công việc đã hoàn thành.", "Chọn công việc", "Sửa công việc", "Thêm ảnh", "Thêm video", "Chọn tệp", "Đã sao chép", "Tên dự án mới", "Tên danh mục mới"],
  th: ["โครงการทั้งหมด", "หมวดหมู่ทั้งหมด", "ไม่มีหมวดหมู่", "สร้างโครงการ", "ลบโครงการที่เลือก", "เลือกโครงการ", "สร้างหมวดหมู่", "ลบหมวดหมู่ที่เลือก", "เลือกหมวดหมู่", "รีเฟรช", "ชื่องาน", "เลือกโครงการเพื่อเพิ่มงาน", "เพิ่มงาน", "เลือกทั้งหมด", "เลือกแล้ว", "กรองชื่องาน", "โครงการ", "หมวดหมู่", "ย้ายไปยังโครงการ", "เลือกหมวดหมู่", "ไม่มีหมวดหมู่ที่ใช้ได้", "เพิ่มหมวดหมู่", "นำหมวดหมู่ออก", "การดำเนินการกับงาน", "ทำเครื่องหมายว่าเสร็จ", "ทำเครื่องหมายว่าใช้งานอยู่", "คัดลอกเป็นข้อความ", "ลบงาน", "กำลังโหลด Vikunja Task Hub…", "ไม่มีงานที่ใช้งานอยู่", "เสร็จแล้ว", "ไม่มีงานที่เสร็จแล้ว", "เลือกงาน", "แก้ไขงาน", "เพิ่มรูปภาพ", "เพิ่มวิดีโอ", "เลือกไฟล์", "คัดลอกแล้ว", "ชื่อโครงการใหม่", "ชื่อหมวดหมู่ใหม่"],
};
const EXTRA_TRANSLATION_KEYS = ["title", "description", "preview", "backDescription", "dueDate", "attachments", "noAttachments", "download", "delete", "filesUpload", "completedLabel", "deleteTask", "cancel", "saveChanges"];
const EXTRA_TRANSLATION_VALUES = {
  en: ["Title", "Description", "Preview", "Back to description", "Due date", "Attachments", "No attachments.", "Download", "Delete", "Files upload immediately. Maximum 20 MB per file.", "Completed", "Delete task", "Cancel", "Save changes"],
  es: ["Título", "Descripción", "Vista previa", "Volver a la descripción", "Fecha límite", "Archivos adjuntos", "Sin archivos adjuntos.", "Descargar", "Eliminar", "Los archivos se suben inmediatamente. Máximo 20 MB por archivo.", "Completada", "Eliminar tarea", "Cancelar", "Guardar cambios"],
  fr: ["Titre", "Description", "Aperçu", "Retour à la description", "Date d’échéance", "Pièces jointes", "Aucune pièce jointe.", "Télécharger", "Supprimer", "Les fichiers sont envoyés immédiatement. Maximum 20 Mo par fichier.", "Terminée", "Supprimer la tâche", "Annuler", "Enregistrer"],
  de: ["Titel", "Beschreibung", "Vorschau", "Zurück zur Beschreibung", "Fälligkeitsdatum", "Anhänge", "Keine Anhänge.", "Herunterladen", "Löschen", "Dateien werden sofort hochgeladen. Maximal 20 MB pro Datei.", "Erledigt", "Aufgabe löschen", "Abbrechen", "Änderungen speichern"],
  ru: ["Название", "Описание", "Предпросмотр", "Вернуться к описанию", "Срок", "Вложения", "Нет вложений.", "Скачать", "Удалить", "Файлы загружаются сразу. Не более 20 МБ на файл.", "Выполнено", "Удалить задачу", "Отмена", "Сохранить изменения"],
  zh: ["标题", "描述", "预览", "返回描述", "截止日期", "附件", "没有附件。", "下载", "删除", "文件会立即上传。每个文件最大 20 MB。", "已完成", "删除任务", "取消", "保存更改"],
  hi: ["शीर्षक", "विवरण", "पूर्वावलोकन", "विवरण पर वापस", "नियत तारीख", "संलग्नक", "कोई संलग्नक नहीं।", "डाउनलोड", "हटाएँ", "फ़ाइलें तुरंत अपलोड होती हैं। प्रति फ़ाइल अधिकतम 20 MB।", "पूर्ण", "कार्य हटाएँ", "रद्द करें", "बदलाव सहेजें"],
  ar: ["العنوان", "الوصف", "معاينة", "العودة إلى الوصف", "تاريخ الاستحقاق", "المرفقات", "لا توجد مرفقات.", "تنزيل", "حذف", "تُرفع الملفات فورًا. الحد الأقصى 20 ميغابايت لكل ملف.", "مكتملة", "حذف المهمة", "إلغاء", "حفظ التغييرات"],
  bn: ["শিরোনাম", "বিবরণ", "প্রিভিউ", "বিবরণে ফিরুন", "নির্ধারিত তারিখ", "সংযুক্তি", "কোনো সংযুক্তি নেই।", "ডাউনলোড", "মুছুন", "ফাইল সঙ্গে সঙ্গে আপলোড হয়। প্রতি ফাইল সর্বোচ্চ 20 MB।", "সম্পন্ন", "কাজ মুছুন", "বাতিল", "পরিবর্তন সংরক্ষণ করুন"],
  pt: ["Título", "Descrição", "Pré-visualização", "Voltar à descrição", "Data de vencimento", "Anexos", "Nenhum anexo.", "Baixar", "Excluir", "Os arquivos são enviados imediatamente. Máximo de 20 MB por arquivo.", "Concluída", "Excluir tarefa", "Cancelar", "Salvar alterações"],
  id: ["Judul", "Deskripsi", "Pratinjau", "Kembali ke deskripsi", "Tanggal jatuh tempo", "Lampiran", "Tidak ada lampiran.", "Unduh", "Hapus", "Berkas langsung diunggah. Maksimum 20 MB per berkas.", "Selesai", "Hapus tugas", "Batal", "Simpan perubahan"],
  ur: ["عنوان", "تفصیل", "پیش منظر", "تفصیل پر واپس", "آخری تاریخ", "منسلکات", "کوئی منسلکات نہیں۔", "ڈاؤن لوڈ", "حذف کریں", "فائلیں فوراً اپ لوڈ ہوتی ہیں۔ فی فائل زیادہ سے زیادہ 20 MB۔", "مکمل", "کام حذف کریں", "منسوخ", "تبدیلیاں محفوظ کریں"],
  uk: ["Назва", "Опис", "Попередній перегляд", "Повернутися до опису", "Термін виконання", "Вкладення", "Немає вкладень.", "Завантажити", "Видалити", "Файли завантажуються одразу. Максимум 20 МБ на файл.", "Виконано", "Видалити завдання", "Скасувати", "Зберегти зміни"],
  it: ["Titolo", "Descrizione", "Anteprima", "Torna alla descrizione", "Scadenza", "Allegati", "Nessun allegato.", "Scarica", "Elimina", "I file vengono caricati immediatamente. Massimo 20 MB per file.", "Completata", "Elimina attività", "Annulla", "Salva modifiche"],
  el: ["Τίτλος", "Περιγραφή", "Προεπισκόπηση", "Επιστροφή στην περιγραφή", "Ημερομηνία λήξης", "Συνημμένα", "Δεν υπάρχουν συνημμένα.", "Λήψη", "Διαγραφή", "Τα αρχεία μεταφορτώνονται αμέσως. Μέγιστο 20 MB ανά αρχείο.", "Ολοκληρωμένη", "Διαγραφή εργασίας", "Ακύρωση", "Αποθήκευση αλλαγών"],
  sr: ["Наслов", "Опис", "Преглед", "Назад на опис", "Рок", "Прилози", "Нема прилога.", "Преузми", "Обриши", "Датотеке се одмах отпремају. Највише 20 MB по датотеци.", "Завршен", "Обриши задатак", "Откажи", "Сачувај измене"],
  hu: ["Cím", "Leírás", "Előnézet", "Vissza a leíráshoz", "Határidő", "Mellékletek", "Nincsenek mellékletek.", "Letöltés", "Törlés", "A fájlok azonnal feltöltődnek. Fájlonként legfeljebb 20 MB.", "Elkészült", "Feladat törlése", "Mégse", "Módosítások mentése"],
  ro: ["Titlu", "Descriere", "Previzualizare", "Înapoi la descriere", "Data scadentă", "Atașamente", "Nu există atașamente.", "Descarcă", "Șterge", "Fișierele se încarcă imediat. Maximum 20 MB per fișier.", "Finalizată", "Șterge sarcina", "Anulează", "Salvează modificările"],
  ga: ["Teideal", "Cur síos", "Réamhamharc", "Ar ais chuig an gcur síos", "Dáta dlite", "Ceangaltáin", "Níl aon cheangaltáin ann.", "Íoslódáil", "Scrios", "Uaslódáiltear comhaid láithreach. Uasmhéid 20 MB in aghaidh an chomhaid.", "Críochnaithe", "Scrios tasc", "Cealaigh", "Sábháil athruithe"],
  pl: ["Tytuł", "Opis", "Podgląd", "Powrót do opisu", "Termin", "Załączniki", "Brak załączników.", "Pobierz", "Usuń", "Pliki są przesyłane natychmiast. Maksymalnie 20 MB na plik.", "Ukończone", "Usuń zadanie", "Anuluj", "Zapisz zmiany"],
  nl: ["Titel", "Beschrijving", "Voorbeeld", "Terug naar beschrijving", "Vervaldatum", "Bijlagen", "Geen bijlagen.", "Downloaden", "Verwijderen", "Bestanden worden direct geüpload. Maximaal 20 MB per bestand.", "Voltooid", "Taak verwijderen", "Annuleren", "Wijzigingen opslaan"],
  tr: ["Başlık", "Açıklama", "Önizleme", "Açıklamaya dön", "Bitiş tarihi", "Ekler", "Ek yok.", "İndir", "Sil", "Dosyalar hemen yüklenir. Dosya başına en fazla 20 MB.", "Tamamlandı", "Görevi sil", "İptal", "Değişiklikleri kaydet"],
  fa: ["عنوان", "توضیحات", "پیش‌نمایش", "بازگشت به توضیحات", "مهلت", "پیوست‌ها", "پیوستی وجود ندارد.", "دانلود", "حذف", "فایل‌ها بلافاصله بارگذاری می‌شوند. حداکثر ۲۰ مگابایت برای هر فایل.", "انجام‌شده", "حذف وظیفه", "لغو", "ذخیره تغییرات"],
  ja: ["タイトル", "説明", "プレビュー", "説明に戻る", "期限", "添付ファイル", "添付ファイルはありません。", "ダウンロード", "削除", "ファイルはすぐにアップロードされます。1ファイル最大20 MBです。", "完了", "タスクを削除", "キャンセル", "変更を保存"],
  ko: ["제목", "설명", "미리 보기", "설명으로 돌아가기", "마감일", "첨부 파일", "첨부 파일이 없습니다.", "다운로드", "삭제", "파일은 즉시 업로드됩니다. 파일당 최대 20 MB입니다.", "완료", "작업 삭제", "취소", "변경 사항 저장"],
  vi: ["Tiêu đề", "Mô tả", "Xem trước", "Quay lại mô tả", "Ngày đến hạn", "Tệp đính kèm", "Không có tệp đính kèm.", "Tải xuống", "Xóa", "Tệp được tải lên ngay lập tức. Tối đa 20 MB mỗi tệp.", "Đã hoàn thành", "Xóa công việc", "Hủy", "Lưu thay đổi"],
  th: ["ชื่อ", "คำอธิบาย", "แสดงตัวอย่าง", "กลับไปยังคำอธิบาย", "วันครบกำหนด", "ไฟล์แนบ", "ไม่มีไฟล์แนบ", "ดาวน์โหลด", "ลบ", "ไฟล์จะอัปโหลดทันที สูงสุด 20 MB ต่อไฟล์", "เสร็จแล้ว", "ลบงาน", "ยกเลิก", "บันทึกการเปลี่ยนแปลง"],
};
const SUPPORT_TRANSLATIONS = {
  en: "🤖 Buy me some ChatGPT Credits", es: "🤖 Invítame a créditos de ChatGPT",
  fr: "🤖 Offrez-moi des crédits ChatGPT", de: "🤖 Spendiere mir ChatGPT-Guthaben",
  ru: "🤖 Поддержать кредитами ChatGPT", zh: "🤖 请我用一些 ChatGPT 点数",
  hi: "🤖 मुझे ChatGPT क्रेडिट दिलाएँ", ar: "🤖 أهدني رصيد ChatGPT",
  bn: "🤖 আমাকে কিছু ChatGPT ক্রেডিট দিন", pt: "🤖 Ofereça-me créditos do ChatGPT",
  id: "🤖 Traktir saya kredit ChatGPT", ur: "🤖 مجھے ChatGPT کریڈٹس دلائیں",
  uk: "🤖 Подаруйте мені кредити ChatGPT", it: "🤖 Offrimi crediti ChatGPT",
  el: "🤖 Κεράστε με μονάδες ChatGPT", sr: "🤖 Частите ме ChatGPT кредитима",
  hu: "🤖 Ajándékozz ChatGPT-kreditet", ro: "🤖 Oferă-mi credite ChatGPT",
  ga: "🤖 Ceannaigh creidmheasanna ChatGPT dom",
  pl: "🤖 Podaruj mi kredyty ChatGPT", nl: "🤖 Geef me ChatGPT-tegoed",
  tr: "🤖 Bana ChatGPT kredisi hediye et", fa: "🤖 به من اعتبار ChatGPT هدیه دهید",
  ja: "🤖 ChatGPTクレジットを贈る", ko: "🤖 ChatGPT 크레딧 선물하기",
  vi: "🤖 Tặng tôi tín dụng ChatGPT", th: "🤖 มอบเครดิต ChatGPT ให้ฉัน",
};
const ABOUT_TRANSLATIONS = {
  en: "About / Repository", es: "Acerca de / Repositorio", fr: "À propos / Dépôt",
  de: "Über / Repository", ru: "О проекте / Репозиторий", zh: "关于 / 代码仓库",
  hi: "परिचय / रिपॉज़िटरी", ar: "حول / المستودع", bn: "সম্পর্কে / রিপোজিটরি",
  pt: "Sobre / Repositório", id: "Tentang / Repositori", ur: "تعارف / ریپوزٹری",
  uk: "Про проєкт / Репозиторій", it: "Informazioni / Repository",
  el: "Πληροφορίες / Αποθετήριο", sr: "О пројекту / Репозиторијум",
  hu: "Névjegy / Kódtár", ro: "Despre / Depozit", ga: "Eolas / Stór",
  pl: "O projekcie / Repozytorium", nl: "Over / Repository", tr: "Hakkında / Depo",
  fa: "درباره / مخزن", ja: "概要 / リポジトリ", ko: "정보 / 저장소",
  vi: "Giới thiệu / Kho mã", th: "เกี่ยวกับ / ที่เก็บโค้ด",
};
const OPEN_VIKUNJA_TRANSLATIONS = {
  en: "Open Vikunja", es: "Abrir Vikunja", fr: "Ouvrir Vikunja", de: "Vikunja öffnen",
  ru: "Открыть Vikunja", zh: "打开 Vikunja", hi: "Vikunja खोलें", ar: "فتح Vikunja",
  bn: "Vikunja খুলুন", pt: "Abrir Vikunja", id: "Buka Vikunja", ur: "Vikunja کھولیں",
  uk: "Відкрити Vikunja", it: "Apri Vikunja", el: "Άνοιγμα Vikunja",
  sr: "Отвори Vikunja", hu: "Vikunja megnyitása", ro: "Deschide Vikunja",
  ga: "Oscail Vikunja",
  pl: "Otwórz Vikunja", nl: "Vikunja openen", tr: "Vikunja'yı aç",
  fa: "باز کردن Vikunja", ja: "Vikunjaを開く", ko: "Vikunja 열기",
  vi: "Mở Vikunja", th: "เปิด Vikunja",
};
const UI_TRANSLATION_KEYS = ["permanentWarning", "affected", "heading", "bold", "italic", "bulletedList", "numberedList", "quote", "link", "inlineCode"];
const UI_TRANSLATION_VALUES = {
  en: ["This cannot be undone.", "Affected", "Heading", "Bold", "Italic", "Bulleted list", "Numbered list", "Quote", "Link", "Inline code"],
  es: ["Esta acción no se puede deshacer.", "Afectadas", "Encabezado", "Negrita", "Cursiva", "Lista con viñetas", "Lista numerada", "Cita", "Enlace", "Código en línea"],
  fr: ["Cette action est irréversible.", "Éléments concernés", "Titre", "Gras", "Italique", "Liste à puces", "Liste numérotée", "Citation", "Lien", "Code en ligne"],
  de: ["Dies kann nicht rückgängig gemacht werden.", "Betroffen", "Überschrift", "Fett", "Kursiv", "Aufzählung", "Nummerierte Liste", "Zitat", "Link", "Inline-Code"],
  ru: ["Это действие нельзя отменить.", "Затронуто", "Заголовок", "Полужирный", "Курсив", "Маркированный список", "Нумерованный список", "Цитата", "Ссылка", "Встроенный код"],
  zh: ["此操作无法撤销。", "受影响", "标题", "粗体", "斜体", "项目符号列表", "编号列表", "引用", "链接", "行内代码"],
  hi: ["इसे पूर्ववत नहीं किया जा सकता।", "प्रभावित", "शीर्षक", "बोल्ड", "इटैलिक", "बुलेट सूची", "क्रमांकित सूची", "उद्धरण", "लिंक", "इनलाइन कोड"],
  ar: ["لا يمكن التراجع عن هذا الإجراء.", "المتأثرة", "عنوان", "عريض", "مائل", "قائمة نقطية", "قائمة مرقمة", "اقتباس", "رابط", "رمز مضمّن"],
  bn: ["এটি পূর্বাবস্থায় ফেরানো যাবে না।", "প্রভাবিত", "শিরোনাম", "গাঢ়", "তির্যক", "বুলেট তালিকা", "সংখ্যাযুক্ত তালিকা", "উদ্ধৃতি", "লিংক", "ইনলাইন কোড"],
  pt: ["Esta ação não pode ser desfeita.", "Afetadas", "Título", "Negrito", "Itálico", "Lista com marcadores", "Lista numerada", "Citação", "Link", "Código em linha"],
  id: ["Tindakan ini tidak dapat dibatalkan.", "Terdampak", "Judul", "Tebal", "Miring", "Daftar berpoin", "Daftar bernomor", "Kutipan", "Tautan", "Kode sebaris"],
  ur: ["اس عمل کو واپس نہیں کیا جا سکتا۔", "متاثرہ", "سرخی", "جلی", "ترچھا", "نقطوں والی فہرست", "نمبر والی فہرست", "اقتباس", "لنک", "ان لائن کوڈ"],
  uk: ["Цю дію неможливо скасувати.", "Зачеплено", "Заголовок", "Жирний", "Курсив", "Маркований список", "Нумерований список", "Цитата", "Посилання", "Вбудований код"],
  it: ["Questa azione non può essere annullata.", "Elementi interessati", "Titolo", "Grassetto", "Corsivo", "Elenco puntato", "Elenco numerato", "Citazione", "Collegamento", "Codice in linea"],
  el: ["Αυτή η ενέργεια δεν αναιρείται.", "Επηρεάζονται", "Επικεφαλίδα", "Έντονα", "Πλάγια", "Λίστα κουκκίδων", "Αριθμημένη λίστα", "Παράθεση", "Σύνδεσμος", "Ενσωματωμένος κώδικας"],
  sr: ["Ова радња се не може опозвати.", "Обухваћено", "Наслов", "Подебљано", "Курзив", "Листа са ознакама", "Нумерисана листа", "Цитат", "Веза", "Уметнути код"],
  hu: ["Ez a művelet nem vonható vissza.", "Érintett", "Címsor", "Félkövér", "Dőlt", "Felsorolás", "Számozott lista", "Idézet", "Hivatkozás", "Soron belüli kód"],
  ro: ["Această acțiune nu poate fi anulată.", "Afectate", "Titlu", "Aldin", "Cursiv", "Listă cu marcatori", "Listă numerotată", "Citat", "Legătură", "Cod în linie"],
  ga: ["Ní féidir é seo a chealú.", "Tionchar", "Ceannteideal", "Trom", "Iodálach", "Liosta le hurchair", "Liosta uimhrithe", "Athfhriotal", "Nasc", "Cód inlíne"],
  pl: ["Tej czynności nie można cofnąć.", "Dotyczy", "Nagłówek", "Pogrubienie", "Kursywa", "Lista punktowana", "Lista numerowana", "Cytat", "Łącze", "Kod w tekście"],
  nl: ["Dit kan niet ongedaan worden gemaakt.", "Betrokken", "Kop", "Vet", "Cursief", "Opsomming", "Genummerde lijst", "Citaat", "Koppeling", "Inlinecode"],
  tr: ["Bu işlem geri alınamaz.", "Etkilenen", "Başlık", "Kalın", "İtalik", "Madde işaretli liste", "Numaralı liste", "Alıntı", "Bağlantı", "Satır içi kod"],
  fa: ["این عملیات قابل بازگشت نیست.", "تحت تأثیر", "سربرگ", "پررنگ", "مورب", "فهرست گلوله‌ای", "فهرست شماره‌دار", "نقل‌قول", "پیوند", "کد درون‌خطی"],
  ja: ["この操作は元に戻せません。", "対象", "見出し", "太字", "斜体", "箇条書き", "番号付きリスト", "引用", "リンク", "インラインコード"],
  ko: ["이 작업은 되돌릴 수 없습니다.", "영향받는 항목", "제목", "굵게", "기울임꼴", "글머리 기호 목록", "번호 매기기 목록", "인용", "링크", "인라인 코드"],
  vi: ["Không thể hoàn tác thao tác này.", "Bị ảnh hưởng", "Tiêu đề", "In đậm", "In nghiêng", "Danh sách dấu đầu dòng", "Danh sách đánh số", "Trích dẫn", "Liên kết", "Mã nội dòng"],
  th: ["ไม่สามารถย้อนกลับการดำเนินการนี้ได้", "ได้รับผลกระทบ", "หัวเรื่อง", "ตัวหนา", "ตัวเอียง", "รายการสัญลักษณ์", "รายการลำดับเลข", "คำอ้างอิง", "ลิงก์", "โค้ดในบรรทัด"],
};
const ERROR_TRANSLATIONS = {
  en: ["Unable to copy selected tasks", "is larger than 20 MB."], es: ["No se pudieron copiar las tareas seleccionadas", "supera los 20 MB."],
  fr: ["Impossible de copier les tâches sélectionnées", "dépasse 20 Mo."], de: ["Ausgewählte Aufgaben konnten nicht kopiert werden", "ist größer als 20 MB."],
  ru: ["Не удалось скопировать выбранные задачи", "превышает 20 МБ."], zh: ["无法复制所选任务", "大于 20 MB。"],
  hi: ["चुने गए कार्य कॉपी नहीं किए जा सके", "20 MB से बड़ा है।"], ar: ["تعذر نسخ المهام المحددة", "أكبر من 20 ميغابايت."],
  bn: ["নির্বাচিত কাজগুলো কপি করা যায়নি", "২০ MB-এর চেয়ে বড়।"], pt: ["Não foi possível copiar as tarefas selecionadas", "é maior que 20 MB."],
  id: ["Tugas terpilih tidak dapat disalin", "lebih besar dari 20 MB."], ur: ["منتخب کام کاپی نہیں ہو سکے", "20 MB سے بڑا ہے۔"],
  uk: ["Не вдалося скопіювати вибрані завдання", "перевищує 20 МБ."], it: ["Impossibile copiare le attività selezionate", "supera 20 MB."],
  el: ["Δεν ήταν δυνατή η αντιγραφή των επιλεγμένων εργασιών", "είναι μεγαλύτερο από 20 MB."], sr: ["Изабрани задаци нису могли да се копирају", "је већа од 20 MB."],
  hu: ["A kijelölt feladatok nem másolhatók", "nagyobb mint 20 MB."], ro: ["Sarcinile selectate nu au putut fi copiate", "depășește 20 MB."],
  ga: ["Níorbh fhéidir na tascanna roghnaithe a chóipeáil", "níos mó ná 20 MB."], pl: ["Nie udało się skopiować wybranych zadań", "jest większy niż 20 MB."],
  nl: ["Geselecteerde taken konden niet worden gekopieerd", "is groter dan 20 MB."], tr: ["Seçili görevler kopyalanamadı", "20 MB'den büyük."],
  fa: ["کپی وظایف انتخاب‌شده ممکن نشد", "بزرگ‌تر از ۲۰ مگابایت است."], ja: ["選択したタスクをコピーできませんでした", "は20 MBを超えています。"],
  ko: ["선택한 작업을 복사할 수 없습니다", "이(가) 20 MB보다 큽니다."], vi: ["Không thể sao chép các công việc đã chọn", "lớn hơn 20 MB."],
  th: ["ไม่สามารถคัดลอกงานที่เลือกได้", "มีขนาดใหญ่กว่า 20 MB"],
};
const RECURRENCE_TRANSLATION_KEYS = ["recurrence", "noRepeat", "daily", "weekly", "monthly", "customInterval", "every", "hours", "days", "weeks", "basedOn", "scheduledDate", "completionDate", "recurringTask"];
const RECURRENCE_TRANSLATION_VALUES = {
  en: ["Recurrence", "Does not repeat", "Daily", "Weekly", "Monthly", "Custom interval", "Every", "Hours", "Days", "Weeks", "Schedule from", "Scheduled date", "Completion date", "Recurring task"],
  es: ["Repetición", "No se repite", "Diariamente", "Semanalmente", "Mensualmente", "Intervalo personalizado", "Cada", "Horas", "Días", "Semanas", "Programar desde", "Fecha programada", "Fecha de finalización", "Tarea recurrente"],
  fr: ["Récurrence", "Aucune répétition", "Chaque jour", "Chaque semaine", "Chaque mois", "Intervalle personnalisé", "Tous les", "Heures", "Jours", "Semaines", "Planifier depuis", "Date planifiée", "Date d’achèvement", "Tâche récurrente"],
  de: ["Wiederholung", "Keine Wiederholung", "Täglich", "Wöchentlich", "Monatlich", "Benutzerdefiniertes Intervall", "Alle", "Stunden", "Tage", "Wochen", "Planen ab", "Geplantem Datum", "Abschlussdatum", "Wiederkehrende Aufgabe"],
  ru: ["Повторение", "Не повторяется", "Ежедневно", "Еженедельно", "Ежемесячно", "Свой интервал", "Каждые", "Часы", "Дни", "Недели", "Отсчёт от", "Плановой даты", "Даты выполнения", "Повторяющаяся задача"],
  zh: ["重复", "不重复", "每天", "每周", "每月", "自定义间隔", "每", "小时", "天", "周", "起算方式", "计划日期", "完成日期", "重复任务"],
  hi: ["दोहराव", "दोहराव नहीं", "प्रतिदिन", "साप्ताहिक", "मासिक", "कस्टम अंतराल", "हर", "घंटे", "दिन", "सप्ताह", "शेड्यूल का आधार", "निर्धारित तारीख", "पूर्ण होने की तारीख", "दोहराया जाने वाला कार्य"],
  ar: ["التكرار", "لا يتكرر", "يوميًا", "أسبوعيًا", "شهريًا", "فاصل مخصص", "كل", "ساعات", "أيام", "أسابيع", "بدء الجدولة من", "التاريخ المجدول", "تاريخ الإكمال", "مهمة متكررة"],
  bn: ["পুনরাবৃত্তি", "পুনরাবৃত্তি নয়", "দৈনিক", "সাপ্তাহিক", "মাসিক", "কাস্টম বিরতি", "প্রতি", "ঘণ্টা", "দিন", "সপ্তাহ", "সময়সূচির ভিত্তি", "নির্ধারিত তারিখ", "সমাপ্তির তারিখ", "পুনরাবৃত্ত কাজ"],
  pt: ["Recorrência", "Não se repete", "Diariamente", "Semanalmente", "Mensalmente", "Intervalo personalizado", "A cada", "Horas", "Dias", "Semanas", "Programar a partir de", "Data programada", "Data de conclusão", "Tarefa recorrente"],
  id: ["Pengulangan", "Tidak berulang", "Harian", "Mingguan", "Bulanan", "Interval khusus", "Setiap", "Jam", "Hari", "Minggu", "Jadwalkan dari", "Tanggal terjadwal", "Tanggal selesai", "Tugas berulang"],
  ur: ["تکرار", "نہیں دہرایا جاتا", "روزانہ", "ہفتہ وار", "ماہانہ", "حسب ضرورت وقفہ", "ہر", "گھنٹے", "دن", "ہفتے", "شیڈول کی بنیاد", "طے شدہ تاریخ", "تکمیل کی تاریخ", "دہرایا جانے والا کام"],
  uk: ["Повторення", "Не повторюється", "Щодня", "Щотижня", "Щомісяця", "Власний інтервал", "Кожні", "Години", "Дні", "Тижні", "Відлік від", "Запланованої дати", "Дати виконання", "Повторюване завдання"],
  it: ["Ricorrenza", "Non si ripete", "Ogni giorno", "Ogni settimana", "Ogni mese", "Intervallo personalizzato", "Ogni", "Ore", "Giorni", "Settimane", "Pianifica da", "Data pianificata", "Data di completamento", "Attività ricorrente"],
  el: ["Επανάληψη", "Δεν επαναλαμβάνεται", "Καθημερινά", "Εβδομαδιαία", "Μηνιαία", "Προσαρμοσμένο διάστημα", "Κάθε", "Ώρες", "Ημέρες", "Εβδομάδες", "Προγραμματισμός από", "Προγραμματισμένη ημερομηνία", "Ημερομηνία ολοκλήρωσης", "Επαναλαμβανόμενη εργασία"],
  sr: ["Понављање", "Не понавља се", "Дневно", "Недељно", "Месечно", "Прилагођени интервал", "Сваких", "Сати", "Дана", "Недеља", "Закажи од", "Заказаног датума", "Датума завршетка", "Понављајући задатак"],
  hu: ["Ismétlődés", "Nem ismétlődik", "Naponta", "Hetente", "Havonta", "Egyéni időköz", "Minden", "Óra", "Nap", "Hét", "Ütemezés alapja", "Ütemezett dátum", "Befejezés dátuma", "Ismétlődő feladat"],
  ro: ["Repetare", "Nu se repetă", "Zilnic", "Săptămânal", "Lunar", "Interval personalizat", "La fiecare", "Ore", "Zile", "Săptămâni", "Programare de la", "Data programată", "Data finalizării", "Sarcină recurentă"],
  ga: ["Atarlú", "Ní athdhéantar", "Gach lá", "Gach seachtain", "Gach mí", "Eatramh saincheaptha", "Gach", "Uaireanta", "Laethanta", "Seachtainí", "Sceideal ó", "Dáta sceidealaithe", "Dáta críochnaithe", "Tasc athfhillteach"],
  pl: ["Powtarzanie", "Nie powtarza się", "Codziennie", "Co tydzień", "Co miesiąc", "Własny interwał", "Co", "Godziny", "Dni", "Tygodnie", "Planuj od", "Planowanej daty", "Daty ukończenia", "Zadanie cykliczne"],
  nl: ["Herhaling", "Wordt niet herhaald", "Dagelijks", "Wekelijks", "Maandelijks", "Aangepast interval", "Elke", "Uren", "Dagen", "Weken", "Plannen vanaf", "Geplande datum", "Voltooiingsdatum", "Terugkerende taak"],
  tr: ["Tekrarlama", "Tekrarlanmaz", "Günlük", "Haftalık", "Aylık", "Özel aralık", "Her", "Saat", "Gün", "Hafta", "Şu tarihten planla", "Planlanan tarih", "Tamamlanma tarihi", "Tekrarlanan görev"],
  fa: ["تکرار", "تکرار نمی‌شود", "روزانه", "هفتگی", "ماهانه", "بازه سفارشی", "هر", "ساعت", "روز", "هفته", "زمان‌بندی از", "تاریخ برنامه‌ریزی‌شده", "تاریخ تکمیل", "وظیفه تکرارشونده"],
  ja: ["繰り返し", "繰り返さない", "毎日", "毎週", "毎月", "カスタム間隔", "間隔", "時間", "日", "週", "基準日", "予定日", "完了日", "繰り返しタスク"],
  ko: ["반복", "반복 안 함", "매일", "매주", "매월", "사용자 지정 간격", "간격", "시간", "일", "주", "기준 날짜", "예정 날짜", "완료 날짜", "반복 작업"],
  vi: ["Lặp lại", "Không lặp lại", "Hằng ngày", "Hằng tuần", "Hằng tháng", "Khoảng tùy chỉnh", "Mỗi", "Giờ", "Ngày", "Tuần", "Lên lịch từ", "Ngày đã lên lịch", "Ngày hoàn thành", "Công việc lặp lại"],
  th: ["การทำซ้ำ", "ไม่ทำซ้ำ", "รายวัน", "รายสัปดาห์", "รายเดือน", "ช่วงเวลาที่กำหนดเอง", "ทุก", "ชั่วโมง", "วัน", "สัปดาห์", "กำหนดจาก", "วันที่กำหนดไว้", "วันที่เสร็จสิ้น", "งานที่ทำซ้ำ"],
};
const MOVE_NEW_PROJECT_TRANSLATIONS = {
  en: "Move to new project", es: "Mover a un proyecto nuevo", fr: "Déplacer vers un nouveau projet",
  de: "In neues Projekt verschieben", ru: "Переместить в новый проект", zh: "移至新项目",
  hi: "नए प्रोजेक्ट में ले जाएँ", ar: "نقل إلى مشروع جديد", bn: "নতুন প্রকল্পে সরান",
  pt: "Mover para novo projeto", id: "Pindahkan ke proyek baru", ur: "نئے پروجیکٹ میں منتقل کریں",
  uk: "Перемістити до нового проєкту", it: "Sposta in un nuovo progetto", el: "Μετακίνηση σε νέο έργο",
  sr: "Премести у нови пројекат", hu: "Áthelyezés új projektbe", ro: "Mută într-un proiect nou",
  ga: "Bog go tionscadal nua", pl: "Przenieś do nowego projektu", nl: "Naar nieuw project verplaatsen",
  tr: "Yeni projeye taşı", fa: "انتقال به پروژه جدید", ja: "新しいプロジェクトへ移動",
  ko: "새 프로젝트로 이동", vi: "Chuyển sang dự án mới", th: "ย้ายไปยังโครงการใหม่",
};
for (const [language, values] of Object.entries(TRANSLATION_VALUES)) {
  if (values.length !== TRANSLATION_KEYS.length) throw new Error(`Invalid ${language} translations`);
  if (EXTRA_TRANSLATION_VALUES[language]?.length !== EXTRA_TRANSLATION_KEYS.length)
    throw new Error(`Invalid ${language} editor translations`);
  if (UI_TRANSLATION_VALUES[language]?.length !== UI_TRANSLATION_KEYS.length)
    throw new Error(`Invalid ${language} interface translations`);
  if (RECURRENCE_TRANSLATION_VALUES[language]?.length !== RECURRENCE_TRANSLATION_KEYS.length)
    throw new Error(`Invalid ${language} recurrence translations`);
}
const TRANSLATIONS = Object.fromEntries(
  Object.entries(TRANSLATION_VALUES).map(([language, values]) => [
    language,
    {
      ...Object.fromEntries(TRANSLATION_KEYS.map((key, index) => [key, values[index]])),
      ...Object.fromEntries(EXTRA_TRANSLATION_KEYS.map((key, index) => [key, EXTRA_TRANSLATION_VALUES[language][index]])),
      ...Object.fromEntries(UI_TRANSLATION_KEYS.map((key, index) => [key, UI_TRANSLATION_VALUES[language][index]])),
      copyFailed: ERROR_TRANSLATIONS[language]?.[0] ?? ERROR_TRANSLATIONS.en[0],
      fileTooLarge: ERROR_TRANSLATIONS[language]?.[1] ?? ERROR_TRANSLATIONS.en[1],
      ...Object.fromEntries(RECURRENCE_TRANSLATION_KEYS.map((key, index) => [key, RECURRENCE_TRANSLATION_VALUES[language][index]])),
      moveToNewProject: MOVE_NEW_PROJECT_TRANSLATIONS[language] ?? MOVE_NEW_PROJECT_TRANSLATIONS.en,
      support: SUPPORT_TRANSLATIONS[language] ?? SUPPORT_TRANSLATIONS.en,
      aboutRepository: ABOUT_TRANSLATIONS[language] ?? ABOUT_TRANSLATIONS.en,
      openVikunja: OPEN_VIKUNJA_TRANSLATIONS[language] ?? OPEN_VIKUNJA_TRANSLATIONS.en,
    },
  ]),
);

class VikunjaTodoCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = undefined;
    this._data = undefined;
    this._vikunjaUrl = undefined;
    this._vikunjaUrlLoading = false;
    this._loading = false;
    this._error = undefined;
    this._selectedProject = undefined;
    this._selectedLabel = "all";
    this._editingTask = undefined;
    this._deleteRequest = undefined;
    this._selectedTasks = new Set();
    this._bulkLabels = new Set();
    this._search = "";
  }

  static getStubConfig() {
    return {};
  }

  getGridOptions() {
    return { columns: "full", min_columns: 6 };
  }

  getCardSize() {
    return 8;
  }

  setConfig(config) {
    if (!config || typeof config !== "object")
      throw new Error("Invalid Vikunja Task Hub card configuration");
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    const firstConnection = !this._hass;
    const previousLanguage = this._language();
    this._hass = hass;
    if (firstConnection && !this._data && !this._loading) void this._load();
    else if (previousLanguage !== this._language()) this._render();
  }

  _language() {
    const language = String(this._hass?.locale?.language ?? this._hass?.language ?? "en")
      .toLowerCase()
      .split("-")[0];
    return TRANSLATIONS[language] ? language : "en";
  }

  _t(key) {
    return TRANSLATIONS[this._language()]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  async _load() {
    if (!this._hass || this._loading) return;
    this._loading = true;
    this._error = undefined;
    this._render();
    try {
      this._data = await this._hass.callWS({
        type: "vikunja/dashboard/get",
        ...(this._config.entry_id ? { entry_id: this._config.entry_id } : {}),
      });
      this._normaliseSelection();
      void this._loadVikunjaUrl();
    } catch (error) {
      this._error = error?.message ?? String(error);
    } finally {
      this._loading = false;
      this._render();
    }
  }

  async _loadVikunjaUrl() {
    if (!this._hass || this._vikunjaUrl || this._vikunjaUrlLoading) return;
    this._vikunjaUrlLoading = true;
    try {
      const result = await this._hass.callWS({
        type: "vikunja/dashboard/web_url",
        ...(this._config.entry_id ? { entry_id: this._config.entry_id } : {}),
      });
      const url = new URL(result?.url);
      if (!['http:', 'https:'].includes(url.protocol)) return;
      this._vikunjaUrl = url.href;
    } catch (_error) {
      // URL discovery is optional and must never interrupt task loading.
    } finally {
      this._vikunjaUrlLoading = false;
      this._render();
    }
  }

  async _action(action, values = {}) {
    if (!this._hass) return;
    this._loading = true;
    this._error = undefined;
    this._render();
    const editingTaskId = this._editingTask?.id;
    try {
      this._data = await this._hass.callWS({
        type: "vikunja/dashboard/action",
        action,
        ...(this._config.entry_id ? { entry_id: this._config.entry_id } : {}),
        ...values,
      });
      if (action === "project_create" && this._data?.created_project_id !== undefined) {
        this._selectedProject = String(this._data.created_project_id);
        this._selectedLabel = "all";
        if (values.task_ids?.length) {
          this._selectedTasks.clear();
          this._bulkLabels.clear();
        }
        this._rememberSelection();
      }
      this._normaliseSelection();
      if (editingTaskId !== undefined)
        this._editingTask = this._data?.tasks.find(
          (task) => Number(task.id) === Number(editingTaskId),
        );
    } catch (error) {
      this._error = error?.message ?? String(error);
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _storageKey() {
    return `${STORAGE_PREFIX}${this._config.storage_key ?? "default"}`;
  }

  _normaliseSelection() {
    const projectIds = (this._data?.projects ?? []).map((project) => String(project.id));
    const remembered = this._readSelection();
    const validSelections = ["all", ...projectIds];
    if (!validSelections.includes(String(this._selectedProject))) {
      this._selectedProject = validSelections.includes(remembered) ? remembered : "all";
    }
    const labelIds = (this._data?.labels ?? []).map((label) => String(label.id));
    if (!["all", "none", ...labelIds].includes(this._selectedLabel)) this._selectedLabel = "all";
    const taskIds = new Set((this._data?.tasks ?? []).map((task) => Number(task.id)));
    this._selectedTasks = new Set([...this._selectedTasks].filter((taskId) => taskIds.has(taskId)));
  }

  _readSelection() {
    try {
      return localStorage.getItem(this._storageKey()) ?? undefined;
    } catch (_error) {
      return undefined;
    }
  }

  _rememberSelection() {
    try {
      localStorage.setItem(this._storageKey(), String(this._selectedProject));
    } catch (_error) {
      /* optional */
    }
  }

  _projectTasks() {
    if (!this._data || !this._selectedProject) return [];
    if (this._selectedProject === "all") return this._data.tasks;
    return this._data.tasks.filter(
      (task) => String(task.project_id) === String(this._selectedProject),
    );
  }

  _filteredTasks(searchValue = this._search) {
    let tasks = this._projectTasks();
    if (this._selectedLabel === "none") tasks = tasks.filter((task) => !task.labels.length);
    else if (this._selectedLabel !== "all")
      tasks = tasks.filter((task) => task.labels.map(String).includes(this._selectedLabel));
    const search = searchValue.trim().toLocaleLowerCase();
    return search ? tasks.filter((task) => task.title.toLocaleLowerCase().includes(search)) : tasks;
  }

  _counts() {
    const projectCounts = new Map();
    const labelCounts = new Map();
    for (const task of this._data?.tasks ?? []) {
      if (!task.done)
        projectCounts.set(
          String(task.project_id),
          (projectCounts.get(String(task.project_id)) ?? 0) + 1,
        );
      if (
        !task.done &&
        (this._selectedProject === "all" ||
          String(task.project_id) === String(this._selectedProject))
      ) {
        if (!task.labels.length) labelCounts.set("none", (labelCounts.get("none") ?? 0) + 1);
        for (const id of task.labels)
          labelCounts.set(String(id), (labelCounts.get(String(id)) ?? 0) + 1);
      }
    }
    return { projectCounts, labelCounts };
  }

  _render() {
    if (!this.shadowRoot) return;
    const data = this._data;
    const { projectCounts, labelCounts } = this._counts();
    const totalActive = (data?.tasks ?? []).filter((task) => !task.done).length;
    const projectOptions =
      `<option value="all" ${this._selectedProject === "all" ? "selected" : ""}>${this._t("allProjects")} (${totalActive})</option>` +
      (data?.projects ?? [])
        .map(
          (project) =>
            `<option value="${project.id}" ${String(project.id) === String(this._selectedProject) ? "selected" : ""}>${this._escape(project.title)} (${projectCounts.get(String(project.id)) ?? 0})</option>`,
        )
        .join("");
    const allActive = this._projectTasks().filter((task) => !task.done).length;
    const labelOptions = (data?.labels ?? [])
      .map(
        (label) =>
          `<option value="${label.id}" ${String(label.id) === this._selectedLabel ? "selected" : ""}>${this._escape(label.title)} (${labelCounts.get(String(label.id)) ?? 0})</option>`,
      )
      .join("");
    const displayed = [...this._filteredTasks("")].sort((left, right) => {
      const leftCreated = Date.parse(left.created ?? "") || 0;
      const rightCreated = Date.parse(right.created ?? "") || 0;
      return rightCreated - leftCreated || Number(right.id) - Number(left.id);
    });
    const active = displayed.filter((task) => !task.done);
    const completed = displayed.filter((task) => task.done);
    const visibleIds = this._filteredTasks().map((task) => Number(task.id));
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((taskId) => this._selectedTasks.has(taskId));
    const selectedTasks = (data?.tasks ?? []).filter((task) =>
      this._selectedTasks.has(Number(task.id)),
    );
    const hasActiveSelected = selectedTasks.some((task) => !task.done);
    const hasCompletedSelected = selectedTasks.some((task) => task.done);
    const selectedCategory = (data?.labels ?? []).find(
      (label) => String(label.id) === String(this._selectedLabel),
    );
    const selectedProject = (data?.projects ?? []).find(
      (project) => String(project.id) === String(this._selectedProject),
    );
    const canDeleteSelectedProject =
      selectedProject && selectedProject.title.trim().toLowerCase() !== "inbox";
    const bulkProjectOptions = (data?.projects ?? [])
      .map((project) => `<option value="${project.id}">${this._escape(project.title)}</option>`)
      .join("");
    const bulkLabelChoices = (data?.labels ?? [])
      .map(
        (label) =>
          `<label><input type="checkbox" value="${label.id}" ${this._bulkLabels.has(String(label.id)) ? "checked" : ""}> <span>${this._escape(label.title)}</span></label>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-width:0; width:100%; grid-column:1 / -1; }
        ha-card { overflow:hidden; width:100%; }
        .toolbar { display:grid; grid-template-columns:repeat(2,minmax(260px,480px)); gap:12px; padding:14px; align-items:end; justify-content:start; }
        select,input,button { font:inherit; color:var(--primary-text-color); }
        select,input { min-width:0; border:1px solid var(--divider-color); border-radius:8px; background:var(--card-background-color); padding:9px 10px; }
        button { border:0; border-radius:8px; background:var(--secondary-background-color); padding:9px 11px; cursor:pointer; }
        button.danger { color:var(--error-color); }
        button.manage-icon { min-width:44px; min-height:44px; padding:5px; font-size:26px; line-height:1; }
        .selector-group { display:grid; grid-template-columns:auto minmax(160px,320px); gap:7px; min-width:0; align-items:center; }
        .selector-actions { min-height:44px; display:flex; gap:6px; flex-wrap:nowrap; align-items:center; }
        .selector-actions button { flex:0 0 auto; }
        .refresh { margin-left:auto; }
        .add { display:grid; grid-template-columns:1fr auto; gap:8px; padding:0 14px 14px; }
        .bulk-bar { padding:12px 14px; border-top:1px solid var(--divider-color); background:var(--secondary-background-color); }
        .selection-tools { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
        .select-all { display:inline-flex; gap:7px; align-items:center; font-weight:600; }
        .task-filter { flex:1 1 240px; max-width:420px; box-sizing:border-box; }
        .bulk-actions { display:grid; grid-template-columns:minmax(180px,1fr) minmax(240px,1.35fr) minmax(260px,1.4fr); gap:12px; margin-top:12px; }
        .bulk-group { min-width:0; padding:11px; border:1px solid var(--divider-color); border-radius:10px; background:var(--card-background-color); }
        .bulk-group-title { display:block; margin-bottom:8px; color:var(--secondary-text-color); font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
        .bulk-group select { width:100%; box-sizing:border-box; }
        .category-picker { position:relative; }
        .category-picker > summary { cursor:pointer; list-style:none; border:1px solid var(--divider-color); border-radius:8px; padding:9px 10px; }
        .category-picker > summary::-webkit-details-marker { display:none; }
        .category-picker > summary::after { content:"▾"; float:right; }
        .category-picker[open] > summary::after { content:"▴"; }
        .category-options { display:grid; gap:7px; max-height:190px; overflow:auto; margin-top:6px; padding:9px; border:1px solid var(--divider-color); border-radius:8px; }
        .category-options label { display:flex; gap:7px; align-items:center; min-width:0; }
        .category-options span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .category-actions,.task-actions { display:flex; gap:7px; flex-wrap:wrap; margin-top:9px; }
        .task-actions { margin-top:0; }
        .list { border-top:1px solid var(--divider-color); }
        .row { display:grid; grid-template-columns:auto minmax(0,1fr); gap:10px; align-items:start; padding:11px 14px; border-bottom:1px solid var(--divider-color); }
        .row[hidden] { display:none; }
        .row.done .summary { text-decoration:line-through; color:var(--secondary-text-color); }
        .body { min-width:0; cursor:pointer; display:block; width:100%; padding:0; border:0; border-radius:0; background:transparent; text-align:left; }
        .summary { font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .description { color:var(--secondary-text-color); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:3px; }
        .empty,.status { padding:18px 14px; color:var(--secondary-text-color); }
        details.completed > summary { cursor:pointer; padding:12px 14px; font-weight:500; }
        .busy { opacity:.55; pointer-events:none; }
        .modal-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.52); display:grid; place-items:center; padding:20px; }
        .dialog { width:min(620px,100%); max-height:90vh; overflow:auto; background:var(--card-background-color); color:var(--primary-text-color); border-radius:14px; box-shadow:var(--ha-card-box-shadow); padding:18px; }
        .dialog h2 { margin:0 0 16px; font-size:20px; }
        .field { display:grid; gap:6px; margin:12px 0; }
        .field textarea { min-height:150px; resize:vertical; border:1px solid var(--divider-color); border-radius:8px; background:var(--card-background-color); color:var(--primary-text-color); padding:10px; font:inherit; }
        .editor-tabs,.format-toolbar { display:flex; gap:6px; flex-wrap:wrap; }
        .editor-tabs { justify-content:flex-end; margin-bottom:7px; }
        .format-toolbar { padding:7px; border:1px solid var(--divider-color); border-bottom:0; border-radius:8px 8px 0 0; background:var(--secondary-background-color); }
        .format-toolbar button { min-width:34px; padding:6px 8px; font-weight:600; }
        .description-editor { border-radius:0 0 8px 8px !important; width:100%; box-sizing:border-box; }
        .description-preview { min-height:150px; padding:10px; border:1px solid var(--divider-color); border-radius:8px; background:var(--secondary-background-color); }
        .field select[multiple] { min-height:100px; }
        .attachments { margin:16px 0; padding:12px; border:1px solid var(--divider-color); border-radius:10px; }
        .attachments h3 { margin:0 0 10px; font-size:15px; }
        .attachment-list { display:grid; gap:7px; margin-bottom:10px; }
        .attachment-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:7px; align-items:center; }
        .attachment-name { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .attachment-meta { color:var(--secondary-text-color); font-size:12px; }
        .attachment-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .capture-input { display:none; }
        .check-field { display:flex; gap:8px; align-items:center; margin:12px 0; }
        .recurrence-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:8px; }
        .recurrence-custom { display:grid; grid-template-columns:minmax(90px,.7fr) minmax(0,1fr); gap:8px; }
        .recurring-icon { margin-right:7px; color:var(--primary-color); font-weight:700; }
        .bulk-project-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .bulk-project-actions select { flex:1 1 190px; }
        .dialog-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }
        .dialog-actions .delete { margin-right:auto; }
        .card-links { display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:16px; }
        .card-link { display:block; padding:9px 13px; border-radius:8px; background:var(--secondary-background-color); color:var(--primary-text-color); text-align:center; text-decoration:none; }
        .delete-impact { padding:12px; border-radius:8px; background:var(--secondary-background-color); }
        .delete-impact strong { color:var(--error-color); }
        button:disabled,input:disabled { opacity:.5; cursor:not-allowed; }
        @media (max-width:900px) { .bulk-actions { grid-template-columns:1fr; } }
        @media (max-width:700px) { .toolbar { grid-template-columns:1fr; } .selector-group { grid-template-columns:auto minmax(0,1fr); } .refresh { margin-left:0; } }
      </style>
      <ha-card class="${this._loading ? "busy" : ""}">
        <div class="toolbar">
          <div class="selector-group">
            <div class="selector-actions">
              <button data-action="new-project" class="manage-icon" title="${this._t("createProject")}" aria-label="${this._t("createProject")}">＋</button>
              ${canDeleteSelectedProject ? `<button data-action="delete-project" class="danger manage-icon" title="${this._t("deleteProject")}" aria-label="${this._t("deleteProject")}">🗑</button>` : ""}
            </div>
            <select data-role="project-select" aria-label="${this._t("selectProject")}">${projectOptions}</select>
          </div>
          <div class="selector-group">
            <div class="selector-actions">
              <button data-action="new-label" class="manage-icon" title="${this._t("createCategory")}" aria-label="${this._t("createCategory")}">＋</button>
              ${selectedCategory ? `<button data-action="delete-label" class="danger manage-icon" title="${this._t("deleteCategory")}" aria-label="${this._t("deleteCategory")}">🗑</button>` : ""}
              <button data-action="refresh" class="refresh" title="${this._t("refresh")}">↻</button>
            </div>
            <select data-role="category-select" aria-label="${this._t("selectCategory")}">
              <option value="all" ${this._selectedLabel === "all" ? "selected" : ""}>${this._t("allCategories")} (${allActive})</option>
              <option value="none" ${this._selectedLabel === "none" ? "selected" : ""}>${this._t("uncategorised")} (${labelCounts.get("none") ?? 0})</option>
              ${labelOptions}
            </select>
          </div>
        </div>
        <form class="add"><input aria-label="${this._t("taskTitle")}" placeholder="${this._selectedProject === "all" ? this._t("selectProjectToAdd") : this._t("taskTitle")}" autocomplete="off" ${this._selectedProject === "all" ? "disabled" : ""}><button type="submit" ${this._selectedProject === "all" ? "disabled" : ""}>${this._t("addTask")}</button></form>
        <div class="bulk-bar">
          <div class="selection-tools">
            <label class="select-all"><input class="select-visible" type="checkbox" ${allVisibleSelected ? "checked" : ""} ${visibleIds.length ? "" : "disabled"}> ${this._t("selectAll")} (${this._selectedTasks.size} ${this._t("selected")})</label>
            <input class="task-filter" type="search" aria-label="${this._t("filterTasks")}" placeholder="${this._t("filterTasks")}" value="${this._escape(this._search)}">
          </div>
          ${
            this._selectedTasks.size
              ? `
            <div class="bulk-actions">
              <div class="bulk-group">
                <span class="bulk-group-title">${this._t("project")}</span>
                <div class="bulk-project-actions">
                  <select class="bulk-project" aria-label="${this._t("moveToProject")}"><option value="">${this._t("moveToProject")}</option>${bulkProjectOptions}</select>
                  <button data-action="bulk-new-project">${this._t("moveToNewProject")}</button>
                </div>
              </div>
              <div class="bulk-group">
                <span class="bulk-group-title">${this._t("categories")}</span>
                <details class="category-picker">
                  <summary>${this._t("chooseCategories")} (${this._bulkLabels.size})</summary>
                  <div class="category-options">${bulkLabelChoices || `<span>${this._t("noCategories")}</span>`}</div>
                </details>
                <div class="category-actions">
                  <button data-action="bulk-add-category" ${this._bulkLabels.size ? "" : "disabled"}>${this._t("addCategories")}</button>
                  <button data-action="bulk-remove-category" ${this._bulkLabels.size ? "" : "disabled"}>${this._t("removeCategories")}</button>
                </div>
              </div>
              <div class="bulk-group">
                <span class="bulk-group-title">${this._t("taskActions")}</span>
                <div class="task-actions">
                  ${hasActiveSelected ? `<button data-action="bulk-complete">${this._t("markComplete")}</button>` : ""}
                  ${hasCompletedSelected ? `<button data-action="bulk-restore">${this._t("markActive")}</button>` : ""}
                  <button data-action="copy-selected">${this._t("copyAsText")}</button>
                  <button data-action="bulk-delete" class="danger">${this._t("deleteTasks")}</button>
                </div>
              </div>
            </div>
          `
              : ""
          }
        </div>
        ${this._error ? `<div class="status">${this._escape(this._error)}</div>` : ""}
        ${
          !data
            ? `<div class="status">${this._t("loading")}</div>`
            : `
          <div class="list active-list">${active.map((task) => this._taskRow(task)).join("")}<div class="empty active-empty" ${active.length ? "hidden" : ""}>${this._t("noActive")}</div></div>
          <details class="completed"><summary>${this._t("completed")} (<span class="completed-count">${completed.length}</span>)</summary><div class="list">${completed.map((task) => this._taskRow(task)).join("")}<div class="empty completed-empty" ${completed.length ? "hidden" : ""}>${this._t("noCompleted")}</div></div></details>
        `
        }
        <div class="card-links">
          ${this._vikunjaUrl ? `<a class="card-link" href="${this._escape(this._vikunjaUrl)}" target="_blank" rel="noopener noreferrer">${this._t("openVikunja")}</a>` : ""}
          <a class="card-link" href="https://github.com/tednv/vikunja-task-hub" target="_blank" rel="noopener noreferrer">${this._t("aboutRepository")}</a>
          <a class="card-link" href="https://buymeacoffee.com/tednv" target="_blank" rel="noopener noreferrer">${this._t("support")}</a>
        </div>
      </ha-card>
      ${this._editingTask ? this._taskDialog(this._editingTask) : ""}
      ${this._deleteRequest ? this._deleteDialog(this._deleteRequest) : ""}`;
    this._wireEvents();
  }

  _taskRow(task) {
    const recurring = Number(task.repeat_after) > 0 || Number(task.repeat_mode) === 1;
    return `<div class="row ${task.done ? "done" : ""}" data-task="${task.id}" data-search-title="${this._escape(task.title.toLocaleLowerCase())}">
      <input type="checkbox" aria-label="${this._t("selectTask")}" ${this._selectedTasks.has(Number(task.id)) ? "checked" : ""}>
      <button type="button" class="body" aria-label="${this._t("editTask")}"><div class="summary">${recurring ? `<span class="recurring-icon" title="${this._t("recurringTask")}" aria-label="${this._t("recurringTask")}">↻</span>` : ""}${this._escape(task.title)}</div>${task.description ? `<div class="description">${this._escape(this._plainText(task.description))}</div>` : ""}</button>
    </div>`;
  }

  _taskDialog(task) {
    const due = task.due ? String(task.due).slice(0, 10) : "";
    const recurrence = this._recurrenceValues(task);
    const categoryOptions = (this._data?.labels ?? [])
      .map(
        (label) =>
          `<option value="${label.id}" ${task.labels.map(String).includes(String(label.id)) ? "selected" : ""}>${this._escape(label.title)}</option>`,
      )
      .join("");
    const attachments = (task.attachments ?? [])
      .map(
        (attachment) => `<div class="attachment-row" data-attachment="${attachment.id}">
      <div class="attachment-name" title="${this._escape(attachment.name)}">${this._escape(attachment.name)} <span class="attachment-meta">(${this._formatBytes(attachment.size)})</span></div>
      <button type="button" class="download-attachment">${this._t("download")}</button>
      <button type="button" class="danger delete-attachment">${this._t("delete")}</button>
    </div>`,
      )
      .join("");
    return `<div class="modal-backdrop" role="dialog" aria-label="${this._t("editTask")}">
      <form class="dialog edit-task-form">
        <h2>${this._t("editTask")}</h2>
        <label class="field">${this._t("title")}<input name="title" value="${this._escape(task.title)}" required></label>
        <div class="field description-field">
          <span>${this._t("description")}</span>
          <div class="editor-tabs"><button type="button" class="preview-toggle">${this._t("preview")}</button></div>
          <div class="description-edit-pane">
            <div class="format-toolbar" aria-label="${this._t("description")}">
              <button type="button" data-format="heading" title="${this._t("heading")}" aria-label="${this._t("heading")}">H</button><button type="button" data-format="bold" title="${this._t("bold")}" aria-label="${this._t("bold")}">B</button><button type="button" data-format="italic" title="${this._t("italic")}" aria-label="${this._t("italic")}"><i>I</i></button>
              <button type="button" data-format="bullet" title="${this._t("bulletedList")}" aria-label="${this._t("bulletedList")}">•</button><button type="button" data-format="numbered" title="${this._t("numberedList")}" aria-label="${this._t("numberedList")}">1.</button><button type="button" data-format="quote" title="${this._t("quote")}" aria-label="${this._t("quote")}">❯</button>
              <button type="button" data-format="link" title="${this._t("link")}" aria-label="${this._t("link")}">🔗</button><button type="button" data-format="code" title="${this._t("inlineCode")}" aria-label="${this._t("inlineCode")}">&lt;/&gt;</button>
            </div>
            <textarea class="description-editor" name="description">${this._escape(task.description ?? "")}</textarea>
          </div>
          <div class="description-preview" hidden><ha-markdown></ha-markdown></div>
        </div>
        <label class="field">${this._t("dueDate")}<input name="due" type="date" value="${this._escape(due)}"></label>
        <div class="field recurrence-grid">
          <label>${this._t("recurrence")}<select name="repeat_preset">
            <option value="none" ${recurrence.preset === "none" ? "selected" : ""}>${this._t("noRepeat")}</option>
            <option value="daily" ${recurrence.preset === "daily" ? "selected" : ""}>${this._t("daily")}</option>
            <option value="weekly" ${recurrence.preset === "weekly" ? "selected" : ""}>${this._t("weekly")}</option>
            <option value="monthly" ${recurrence.preset === "monthly" ? "selected" : ""}>${this._t("monthly")}</option>
            <option value="custom" ${recurrence.preset === "custom" ? "selected" : ""}>${this._t("customInterval")}</option>
          </select></label>
          <label class="repeat-basis">${this._t("basedOn")}<select name="repeat_mode">
            <option value="0" ${recurrence.mode === 0 ? "selected" : ""}>${this._t("scheduledDate")}</option>
            <option value="2" ${recurrence.mode === 2 ? "selected" : ""}>${this._t("completionDate")}</option>
          </select></label>
          <div class="recurrence-custom">
            <label>${this._t("every")}<input name="repeat_amount" type="number" min="1" max="10000" step="1" value="${recurrence.amount}"></label>
            <label>${this._t("customInterval")}<select name="repeat_unit">
              <option value="3600" ${recurrence.unit === 3600 ? "selected" : ""}>${this._t("hours")}</option>
              <option value="86400" ${recurrence.unit === 86400 ? "selected" : ""}>${this._t("days")}</option>
              <option value="604800" ${recurrence.unit === 604800 ? "selected" : ""}>${this._t("weeks")}</option>
            </select></label>
          </div>
        </div>
        <label class="field">${this._t("categories")}<select name="labels" multiple>${categoryOptions}</select></label>
        <section class="attachments">
          <h3>${this._t("attachments")} (${(task.attachments ?? []).length})</h3>
          <div class="attachment-list">${attachments || `<span class="attachment-meta">${this._t("noAttachments")}</span>`}</div>
          <div class="attachment-actions">
            <button type="button" class="take-photo">${this._t("addPhoto")}</button>
            <button type="button" class="record-video">${this._t("addVideo")}</button>
            <button type="button" class="choose-files">${this._t("chooseFiles")}</button>
          </div>
          <input class="capture-input photo-input" type="file" accept="image/*" capture="environment">
          <input class="capture-input video-input" type="file" accept="video/*" capture="environment">
          <input class="capture-input file-input" type="file" multiple>
          <div class="attachment-meta">${this._t("filesUpload")}</div>
        </section>
        <label class="check-field"><input name="done" type="checkbox" ${task.done ? "checked" : ""}> ${this._t("completedLabel")}</label>
        <div class="dialog-actions">
          <button type="button" class="danger delete delete-editor-task">${this._t("deleteTask")}</button>
          <button type="button" class="cancel-editor">${this._t("cancel")}</button>
          <button type="submit">${this._t("saveChanges")}</button>
        </div>
      </form>
    </div>`;
  }

  _deleteDialog(request) {
    if (request.type === "tasks") {
      return `<div class="modal-backdrop" role="dialog" aria-label="${this._t("deleteTasks")}">
        <form class="dialog bulk-delete-confirmation-form">
          <h2>${this._t("deleteTasks")}?</h2>
          <p class="delete-impact"><strong>${request.count} ${this._t("selected")}</strong>. ${this._t("permanentWarning")}</p>
          <div class="dialog-actions"><button type="button" class="cancel-delete">${this._t("cancel")}</button><button type="submit" class="danger">${this._t("deleteTasks")}</button></div>
        </form>
      </div>`;
    }
    const deleteLabel = request.type === "project" ? this._t("deleteProject") : this._t("deleteCategory");
    const impactControls =
      request.count > 0
        ? `
        <p>${this._t("affected")}: <strong>${request.count}</strong>.</p>
        <label class="check-field"><input name="delete_tasks" type="checkbox"> ${this._t("deleteTasks")}: ${request.count}</label>
        <p class="delete-impact">${
          request.type === "project"
            ? `${this._t("moveToProject")}: <strong>Inbox</strong>.`
            : `${this._t("removeCategories")}: <strong>${request.count}</strong>.`
        }</p>`
        : "";
    return `<div class="modal-backdrop" role="dialog" aria-label="${deleteLabel}">
      <form class="dialog delete-confirmation-form">
        <h2>${deleteLabel}: “${this._escape(request.title)}”?</h2>
        ${impactControls}
        <div class="dialog-actions">
          <button type="button" class="cancel-delete">${this._t("cancel")}</button>
          <button type="submit" class="danger">${deleteLabel}</button>
        </div>
      </form>
    </div>`;
  }

  _wireEvents() {
    const root = this.shadowRoot;
    root.querySelector('[data-role="project-select"]')?.addEventListener("change", (event) => {
      this._selectedProject = event.target.value;
      this._selectedLabel = "all";
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      this._rememberSelection();
      this._render();
    });
    root.querySelector('[data-role="category-select"]')?.addEventListener("change", (event) => {
      this._selectedLabel = event.target.value;
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      this._render();
    });
    root.querySelector(".select-visible")?.addEventListener("change", (event) => {
      const visibleIds = this._filteredTasks().map((task) => Number(task.id));
      if (event.target.checked) visibleIds.forEach((taskId) => this._selectedTasks.add(taskId));
      else visibleIds.forEach((taskId) => this._selectedTasks.delete(taskId));
      this._render();
    });
    root.querySelector(".task-filter")?.addEventListener("input", (event) => {
      this._search = event.target.value;
      this._applySearchFilter();
    });
    root.querySelector("form.add")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = event.currentTarget.querySelector("input");
      const title = input.value.trim();
      if (!title || !this._selectedProject) return;
      const label_ids = /^\d+$/.test(this._selectedLabel) ? [Number(this._selectedLabel)] : [];
      void this._action("task_create", {
        project_id: Number(this._selectedProject),
        title,
        label_ids,
      });
    });
    root.querySelectorAll(".row").forEach((row) => {
      const taskId = Number(row.dataset.task);
      row.querySelector('input[type="checkbox"]')?.addEventListener("change", (event) => {
        if (event.target.checked) this._selectedTasks.add(taskId);
        else this._selectedTasks.delete(taskId);
        this._render();
      });
      row.querySelector(".body")?.addEventListener("click", () => {
        this._editingTask = this._data?.tasks.find((task) => Number(task.id) === taskId);
        this._render();
      });
    });
    this._applySearchFilter();
    const editor = root.querySelector(".edit-task-form");
    const description = editor?.querySelector('[name="description"]');
    const preview = editor?.querySelector(".description-preview");
    const markdown = preview?.querySelector("ha-markdown");
    const updatePreview = () => {
      if (markdown) markdown.content = description?.value ?? "";
    };
    updatePreview();
    const repeatPreset = editor?.querySelector('[name="repeat_preset"]');
    const syncRecurrence = () => {
      const preset = repeatPreset?.value ?? "none";
      const custom = editor?.querySelector(".recurrence-custom");
      const basis = editor?.querySelector(".repeat-basis");
      if (custom) custom.hidden = preset !== "custom";
      if (basis) basis.hidden = preset === "none" || preset === "monthly";
    };
    repeatPreset?.addEventListener("change", syncRecurrence);
    syncRecurrence();
    editor?.querySelector(".preview-toggle")?.addEventListener("click", (event) => {
      const showPreview = preview.hidden;
      editor.querySelector(".description-edit-pane").hidden = showPreview;
      preview.hidden = !showPreview;
      event.currentTarget.textContent = showPreview
        ? this._t("backDescription")
        : this._t("preview");
      if (showPreview) updatePreview();
      else description.focus();
    });
    editor
      ?.querySelectorAll("[data-format]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          this._formatDescription(description, button.dataset.format),
        ),
      );
    description?.addEventListener("input", updatePreview);
    editor?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(editor);
      const label_ids = Array.from(editor.querySelector('[name="labels"]').selectedOptions).map(
        (option) => Number(option.value),
      );
      const task_id = Number(this._editingTask.id);
      const recurrence = this._recurrenceFromForm(form);
      this._editingTask = undefined;
      void this._action("task_update", {
        task_id,
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? ""),
        due: String(form.get("due") ?? "") || null,
        done: form.get("done") === "on",
        repeat_after: recurrence.repeatAfter,
        repeat_mode: recurrence.repeatMode,
        label_ids,
      });
    });
    editor?.querySelector(".cancel-editor")?.addEventListener("click", () => {
      this._editingTask = undefined;
      this._render();
    });
    editor?.querySelector(".delete-editor-task")?.addEventListener("click", () => {
      const task_id = Number(this._editingTask.id);
      if (confirm(`${this._t("deleteTask")}? ${this._t("permanentWarning")}`)) {
        this._editingTask = undefined;
        void this._action("task_delete", { task_id });
      }
    });
    const attachmentInputs = [
      [".take-photo", ".photo-input"],
      [".record-video", ".video-input"],
      [".choose-files", ".file-input"],
    ];
    attachmentInputs.forEach(([buttonSelector, inputSelector]) => {
      const input = editor?.querySelector(inputSelector);
      editor?.querySelector(buttonSelector)?.addEventListener("click", () => input?.click());
      input?.addEventListener(
        "change",
        () => void this._uploadAttachmentFiles([...(input.files ?? [])]),
      );
    });
    editor?.querySelectorAll(".attachment-row").forEach((row) => {
      const attachment_id = Number(row.dataset.attachment);
      const attachment = this._editingTask.attachments.find(
        (item) => Number(item.id) === attachment_id,
      );
      row
        .querySelector(".download-attachment")
        ?.addEventListener(
          "click",
          () => void this._downloadAttachment(Number(this._editingTask.id), attachment),
        );
      row.querySelector(".delete-attachment")?.addEventListener("click", () => {
        if (confirm(`${this._t("delete")}: "${attachment.name}"? ${this._t("permanentWarning")}`))
          void this._action("attachment_delete", {
            task_id: Number(this._editingTask.id),
            attachment_id,
          });
      });
    });
    const deleteForm = root.querySelector(".delete-confirmation-form");
    deleteForm?.querySelector('[name="delete_tasks"]')?.addEventListener("change", (event) => {
      const request = this._deleteRequest;
      deleteForm.querySelector(".delete-impact").innerHTML = event.target.checked
        ? `${this._t("deleteTasks")}: <strong>${request.count}</strong>. ${this._t("permanentWarning")}`
        : request.type === "project"
          ? `${this._t("moveToProject")}: <strong>Inbox</strong>.`
          : `${this._t("removeCategories")}: <strong>${request.count}</strong>.`;
    });
    deleteForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const request = this._deleteRequest;
      const delete_tasks = deleteForm.querySelector('[name="delete_tasks"]')?.checked ?? false;
      this._deleteRequest = undefined;
      if (request.type === "project")
        void this._action("project_delete", { project_id: request.id, delete_tasks });
      else void this._action("label_delete", { label_id: request.id, delete_tasks });
    });
    deleteForm?.querySelector(".cancel-delete")?.addEventListener("click", () => {
      this._deleteRequest = undefined;
      this._render();
    });
    const bulkDeleteForm = root.querySelector(".bulk-delete-confirmation-form");
    bulkDeleteForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const task_ids = [...this._selectedTasks];
      this._deleteRequest = undefined;
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      void this._action("task_bulk_delete", { task_ids });
    });
    bulkDeleteForm?.querySelector(".cancel-delete")?.addEventListener("click", () => {
      this._deleteRequest = undefined;
      this._render();
    });
    root.querySelectorAll(".modal-backdrop").forEach((backdrop) =>
      backdrop.addEventListener("click", (event) => {
        if (event.target === event.currentTarget) {
          this._editingTask = undefined;
          this._deleteRequest = undefined;
          this._render();
        }
      }),
    );
    root
      .querySelector('[data-action="refresh"]')
      ?.addEventListener("click", () => void this._load());
    root.querySelector(".bulk-project")?.addEventListener("change", (event) => {
      if (!/^\d+$/.test(event.target.value)) return;
      const task_ids = [...this._selectedTasks];
      this._selectedTasks.clear();
      this._bulkLabels.clear();
      void this._action("task_bulk_update", { task_ids, project_id: Number(event.target.value) });
    });
    root.querySelector('[data-action="bulk-new-project"]')?.addEventListener("click", () => {
      const title = prompt(this._t("newProjectName"));
      if (!title?.trim()) return;
      const task_ids = [...this._selectedTasks];
      void this._action("project_create", { title, task_ids });
    });
    root.querySelector(".category-options")?.addEventListener("change", (event) => {
      if (!event.target.matches('input[type="checkbox"]')) return;
      if (event.target.checked) this._bulkLabels.add(event.target.value);
      else this._bulkLabels.delete(event.target.value);
      const summary = root.querySelector(".category-picker summary");
      if (summary) summary.textContent = `${this._t("chooseCategories")} (${this._bulkLabels.size})`;
      root
        .querySelectorAll('[data-action="bulk-add-category"],[data-action="bulk-remove-category"]')
        .forEach((button) => {
          button.disabled = !this._bulkLabels.size;
        });
    });
    root
      .querySelector('[data-action="bulk-add-category"]')
      ?.addEventListener("click", () => this._runBulkLabel("add"));
    root
      .querySelector('[data-action="bulk-remove-category"]')
      ?.addEventListener("click", () => this._runBulkLabel("remove"));
    root
      .querySelector('[data-action="bulk-complete"]')
      ?.addEventListener("click", () => this._runBulkDone(true));
    root
      .querySelector('[data-action="bulk-restore"]')
      ?.addEventListener("click", () => this._runBulkDone(false));
    root.querySelector('[data-action="copy-selected"]')?.addEventListener("click", (event) => {
      void this._copySelectedTasks(event.currentTarget);
    });
    root.querySelector('[data-action="bulk-delete"]')?.addEventListener("click", () => {
      this._deleteRequest = { type: "tasks", count: this._selectedTasks.size };
      this._render();
    });
    root.querySelector('[data-action="new-project"]')?.addEventListener("click", () => {
      const title = prompt(this._t("newProjectName"));
      if (title?.trim()) void this._action("project_create", { title });
    });
    root.querySelector('[data-action="delete-project"]')?.addEventListener("click", () => {
      const project = this._data?.projects.find(
        (item) => String(item.id) === String(this._selectedProject),
      );
      if (!project) return;
      const count = this._data.tasks.filter(
        (task) => String(task.project_id) === String(project.id),
      ).length;
      this._deleteRequest = { type: "project", id: project.id, title: project.title, count };
      this._render();
    });
    root.querySelector('[data-action="new-label"]')?.addEventListener("click", () => {
      const title = prompt(this._t("newCategoryName"));
      if (title?.trim()) void this._action("label_create", { title });
    });
    root.querySelector('[data-action="delete-label"]')?.addEventListener("click", () => {
      if (!/^\d+$/.test(this._selectedLabel)) return;
      const label = this._data?.labels.find((item) => String(item.id) === this._selectedLabel);
      if (!label) return;
      const count = this._data.tasks.filter((task) =>
        task.labels.map(String).includes(String(label.id)),
      ).length;
      this._deleteRequest = { type: "category", id: label.id, title: label.title, count };
      this._render();
    });
  }

  _applySearchFilter() {
    const root = this.shadowRoot;
    if (!root) return;
    const search = this._search.trim().toLocaleLowerCase();
    let activeCount = 0;
    let completedCount = 0;
    root.querySelectorAll(".row").forEach((row) => {
      const matches = !search || row.dataset.searchTitle.includes(search);
      row.hidden = !matches;
      if (matches) {
        if (row.classList.contains("done")) completedCount += 1;
        else activeCount += 1;
      }
    });
    const activeEmpty = root.querySelector(".active-empty");
    if (activeEmpty) activeEmpty.hidden = activeCount > 0;
    const completedEmpty = root.querySelector(".completed-empty");
    if (completedEmpty) completedEmpty.hidden = completedCount > 0;
    const completedCountNode = root.querySelector(".completed-count");
    if (completedCountNode) completedCountNode.textContent = String(completedCount);
    const visibleIds = this._filteredTasks().map((task) => Number(task.id));
    const selectVisible = root.querySelector(".select-visible");
    if (selectVisible) {
      selectVisible.disabled = visibleIds.length === 0;
      selectVisible.checked =
        visibleIds.length > 0 && visibleIds.every((taskId) => this._selectedTasks.has(taskId));
    }
  }

  _escape(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _runBulkLabel(operation) {
    if (!this._bulkLabels.size || !this._selectedTasks.size) return;
    const task_ids = [...this._selectedTasks];
    const label_ids = [...this._bulkLabels].map(Number);
    this._selectedTasks.clear();
    this._bulkLabels.clear();
    void this._action("task_bulk_update", { task_ids, label_ids, label_operation: operation });
  }

  _runBulkDone(done) {
    if (!this._selectedTasks.size) return;
    const task_ids = [...this._selectedTasks];
    this._selectedTasks.clear();
    this._bulkLabels.clear();
    void this._action("task_bulk_update", { task_ids, done });
  }

  async _copySelectedTasks(button) {
    const tasks = (this._data?.tasks ?? []).filter((task) =>
      this._selectedTasks.has(Number(task.id)),
    );
    const text = tasks
      .map((task) => {
        const description = this._plainText(task.description ?? "").trim();
        return description ? `${task.title}\n${description}` : task.title;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = this._t("copied");
    } catch (error) {
      this._error = error?.message ?? this._t("copyFailed");
      this._render();
    }
  }

  _plainText(value) {
    const parsed = new DOMParser().parseFromString(String(value), "text/html");
    return (parsed.body.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  _formatBytes(value) {
    const bytes = Number(value) || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  _recurrenceValues(task) {
    const repeatAfter = Math.max(0, Number(task.repeat_after) || 0);
    const mode = Number(task.repeat_mode) === 2 ? 2 : Number(task.repeat_mode) === 1 ? 1 : 0;
    if (mode === 1) return { preset: "monthly", amount: 1, unit: 86400, mode: 1 };
    if (!repeatAfter) return { preset: "none", amount: 1, unit: 86400, mode: 0 };
    if (repeatAfter === 86400) return { preset: "daily", amount: 1, unit: 86400, mode };
    if (repeatAfter === 604800) return { preset: "weekly", amount: 1, unit: 604800, mode };
    const unit = repeatAfter % 604800 === 0 ? 604800 : repeatAfter % 86400 === 0 ? 86400 : 3600;
    return { preset: "custom", amount: Math.max(1, repeatAfter / unit), unit, mode };
  }

  _recurrenceFromForm(form) {
    const preset = String(form.get("repeat_preset") ?? "none");
    if (preset === "none") return { repeatAfter: 0, repeatMode: 0 };
    if (preset === "monthly") return { repeatAfter: 0, repeatMode: 1 };
    const repeatMode = Number(form.get("repeat_mode")) === 2 ? 2 : 0;
    if (preset === "daily") return { repeatAfter: 86400, repeatMode };
    if (preset === "weekly") return { repeatAfter: 604800, repeatMode };
    const amount = Math.min(10000, Math.max(1, Math.floor(Number(form.get("repeat_amount")) || 1)));
    const unit = [3600, 86400, 604800].includes(Number(form.get("repeat_unit")))
      ? Number(form.get("repeat_unit"))
      : 86400;
    return { repeatAfter: amount * unit, repeatMode };
  }

  async _fileBase64(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000)
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return btoa(binary);
  }

  async _uploadAttachmentFiles(chosen) {
    if (!chosen.length || !this._editingTask) return;
    const oversized = chosen.find((file) => file.size > 20 * 1024 * 1024);
    if (oversized) {
      this._error = `${oversized.name} ${this._t("fileTooLarge")}`;
      this._render();
      return;
    }
    const files = await Promise.all(
      chosen.map(async (file) => ({
        name: file.name,
        mime: file.type || "application/octet-stream",
        data: await this._fileBase64(file),
      })),
    );
    void this._action("attachment_upload", { task_id: Number(this._editingTask.id), files });
  }

  async _downloadAttachment(taskId, attachment) {
    if (!this._hass || !attachment) return;
    try {
      const result = await this._hass.callWS({
        type: "vikunja/dashboard/action",
        action: "attachment_download",
        ...(this._config.entry_id ? { entry_id: this._config.entry_id } : {}),
        task_id: taskId,
        attachment_id: attachment.id,
        title: attachment.name,
      });
      const binary = atob(result.data);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
      const url = URL.createObjectURL(new Blob([bytes], { type: result.mime || attachment.mime }));
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      this._error = error?.message ?? String(error);
      this._render();
    }
  }

  _formatDescription(textarea, format) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    const inline = {
      bold: [`**`, `**`, "bold text"],
      italic: [`*`, `*`, "italic text"],
      link: [`[`, `](https://)`, "link text"],
      code: ["`", "`", "code"],
    };
    let replacement;
    if (inline[format]) {
      const [before, after, fallback] = inline[format];
      replacement = `${before}${selected || fallback}${after}`;
    } else {
      const prefix = { heading: "## ", bullet: "- ", numbered: "1. ", quote: "> " }[format] ?? "";
      replacement = (selected || "text")
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n");
    }
    textarea.setRangeText(replacement, start, end, "end");
    textarea.focus();
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

if (!customElements.get(CARD_TYPE)) customElements.define(CARD_TYPE, VikunjaTodoCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TYPE))
  window.customCards.push({
    type: CARD_TYPE,
    name: "Vikunja Task Hub",
    description: "Manage Vikunja projects, categories, tasks, and attachments from Home Assistant.",
    preview: true,
  });
