--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: chapters_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chapters_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chapters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapters (
    id integer DEFAULT nextval('public.chapters_id_seq'::regclass) NOT NULL,
    discipline_id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    order_index integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_tasks (
    id integer NOT NULL,
    module_id integer NOT NULL,
    day integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    learning_content text NOT NULL,
    estimated_minutes integer NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: daily_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_tasks_id_seq OWNED BY public.daily_tasks.id;


--
-- Name: exam_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_subjects (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    weight text NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: exam_subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_subjects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: exam_subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_subjects_id_seq OWNED BY public.exam_subjects.id;


--
-- Name: knowledge_points_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knowledge_points_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knowledge_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_points (
    id integer DEFAULT nextval('public.knowledge_points_id_seq'::regclass) NOT NULL,
    chapter_id integer NOT NULL,
    subject_id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    difficulty integer NOT NULL,
    importance integer NOT NULL,
    keywords text[],
    tags jsonb,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: knowledge_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_tasks (
    id integer NOT NULL,
    daily_task_id integer NOT NULL,
    knowledge_point_id integer NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: knowledge_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knowledge_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: knowledge_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knowledge_tasks_id_seq OWNED BY public.knowledge_tasks.id;


--
-- Name: nursing_disciplines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nursing_disciplines (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    image_url text,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: nursing_disciplines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nursing_disciplines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: nursing_disciplines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nursing_disciplines_id_seq OWNED BY public.nursing_disciplines.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    quiz_id integer NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    options jsonb,
    answer text NOT NULL,
    explanation text NOT NULL,
    points integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id integer NOT NULL,
    test_bank_id integer NOT NULL,
    knowledge_point_id integer,
    question_type text NOT NULL,
    content text NOT NULL,
    options jsonb,
    correct_answer text NOT NULL,
    explanation text NOT NULL,
    difficulty integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_questions_id_seq OWNED BY public.quiz_questions.id;


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id integer NOT NULL,
    task_id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    pass_score integer NOT NULL,
    time_limit integer,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quizzes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


--
-- Name: study_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_modules (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "order" integer NOT NULL,
    duration_days integer NOT NULL,
    importance integer NOT NULL,
    difficulty integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: study_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.study_modules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: study_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.study_modules_id_seq OWNED BY public.study_modules.id;


--
-- Name: study_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_plans (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    total_days integer NOT NULL,
    start_date timestamp(6) without time zone NOT NULL,
    end_date timestamp(6) without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    exam_year integer,
    plan_data jsonb DEFAULT '{}'::jsonb
);


--
-- Name: study_plans_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_plans_backup (
    id integer,
    user_id integer,
    title text,
    overview text,
    profession text,
    target_title text,
    total_days integer,
    start_date timestamp(6) without time zone,
    end_date timestamp(6) without time zone,
    is_active boolean,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    subject_ids integer[],
    discipline_ids integer[],
    exam_year integer,
    custom_settings jsonb,
    plan_data jsonb
);


--
-- Name: study_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.study_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: study_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.study_plans_id_seq OWNED BY public.study_plans.id;


--
-- Name: test_banks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_banks (
    id integer NOT NULL,
    subject_id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    type text NOT NULL,
    year integer,
    total_questions integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: test_banks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_banks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: test_banks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_banks_id_seq OWNED BY public.test_banks.id;


--
-- Name: user_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_progress (
    id integer NOT NULL,
    user_id integer NOT NULL,
    task_id integer NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    time_spent integer DEFAULT 0 NOT NULL,
    last_accessed_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_progress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: user_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_progress_id_seq OWNED BY public.user_progress.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    profession text NOT NULL,
    current_title text NOT NULL,
    target_title text NOT NULL,
    work_years integer,
    study_time_per_day integer,
    exam_date timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    nursing_assistant_user_id text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: daily_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_tasks ALTER COLUMN id SET DEFAULT nextval('public.daily_tasks_id_seq'::regclass);


--
-- Name: exam_subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_subjects ALTER COLUMN id SET DEFAULT nextval('public.exam_subjects_id_seq'::regclass);


--
-- Name: knowledge_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_tasks ALTER COLUMN id SET DEFAULT nextval('public.knowledge_tasks_id_seq'::regclass);


--
-- Name: nursing_disciplines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nursing_disciplines ALTER COLUMN id SET DEFAULT nextval('public.nursing_disciplines_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: quiz_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN id SET DEFAULT nextval('public.quiz_questions_id_seq'::regclass);


--
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- Name: study_modules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_modules ALTER COLUMN id SET DEFAULT nextval('public.study_modules_id_seq'::regclass);


--
-- Name: study_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_plans ALTER COLUMN id SET DEFAULT nextval('public.study_plans_id_seq'::regclass);


--
-- Name: test_banks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_banks ALTER COLUMN id SET DEFAULT nextval('public.test_banks_id_seq'::regclass);


--
-- Name: user_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_progress ALTER COLUMN id SET DEFAULT nextval('public.user_progress_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_unique UNIQUE (username);


--
-- Name: chapters chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (id);


--
-- Name: daily_tasks daily_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_pkey PRIMARY KEY (id);


--
-- Name: exam_subjects exam_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_subjects
    ADD CONSTRAINT exam_subjects_pkey PRIMARY KEY (id);


--
-- Name: knowledge_points knowledge_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_points
    ADD CONSTRAINT knowledge_points_pkey PRIMARY KEY (id);


--
-- Name: knowledge_tasks knowledge_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_tasks
    ADD CONSTRAINT knowledge_tasks_pkey PRIMARY KEY (id);


--
-- Name: nursing_disciplines nursing_disciplines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nursing_disciplines
    ADD CONSTRAINT nursing_disciplines_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: study_modules study_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_modules
    ADD CONSTRAINT study_modules_pkey PRIMARY KEY (id);


--
-- Name: study_plans study_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_plans
    ADD CONSTRAINT study_plans_pkey PRIMARY KEY (id);


--
-- Name: test_banks test_banks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_banks
    ADD CONSTRAINT test_banks_pkey PRIMARY KEY (id);


--
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: chapters chapters_discipline_id_nursing_disciplines_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_discipline_id_nursing_disciplines_id_fk FOREIGN KEY (discipline_id) REFERENCES public.nursing_disciplines(id);


--
-- Name: daily_tasks daily_tasks_module_id_study_modules_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_module_id_study_modules_id_fk FOREIGN KEY (module_id) REFERENCES public.study_modules(id);


--
-- Name: knowledge_points knowledge_points_chapter_id_chapters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_points
    ADD CONSTRAINT knowledge_points_chapter_id_chapters_id_fk FOREIGN KEY (chapter_id) REFERENCES public.chapters(id);


--
-- Name: knowledge_points knowledge_points_subject_id_exam_subjects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_points
    ADD CONSTRAINT knowledge_points_subject_id_exam_subjects_id_fk FOREIGN KEY (subject_id) REFERENCES public.exam_subjects(id);


--
-- Name: knowledge_tasks knowledge_tasks_daily_task_id_daily_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_tasks
    ADD CONSTRAINT knowledge_tasks_daily_task_id_daily_tasks_id_fk FOREIGN KEY (daily_task_id) REFERENCES public.daily_tasks(id);


--
-- Name: questions questions_quiz_id_quizzes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_quiz_id_quizzes_id_fk FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id);


--
-- Name: quiz_questions quiz_questions_test_bank_id_test_banks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_test_bank_id_test_banks_id_fk FOREIGN KEY (test_bank_id) REFERENCES public.test_banks(id);


--
-- Name: quizzes quizzes_task_id_daily_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_task_id_daily_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.daily_tasks(id);


--
-- Name: study_modules study_modules_plan_id_study_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_modules
    ADD CONSTRAINT study_modules_plan_id_study_plans_id_fk FOREIGN KEY (plan_id) REFERENCES public.study_plans(id);


--
-- Name: study_plans study_plans_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_plans
    ADD CONSTRAINT study_plans_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: test_banks test_banks_subject_id_exam_subjects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_banks
    ADD CONSTRAINT test_banks_subject_id_exam_subjects_id_fk FOREIGN KEY (subject_id) REFERENCES public.exam_subjects(id);


--
-- Name: user_progress user_progress_task_id_daily_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_task_id_daily_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.daily_tasks(id);


--
-- Name: user_progress user_progress_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

