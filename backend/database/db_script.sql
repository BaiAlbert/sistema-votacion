-- Active: 1769464431406@@127.0.0.1@3306@app_votaciones

create table usuarios (
    id int auto_increment primary key,
    username varchar(50) not null unique,
    password varchar(255) not null,
    nombre varchar(50) not null,
    apellidos varchar(100) not null,
    email varchar(100) not null unique,
    num_telefono int not null unique,
    provincia varchar(50) not null,
    ciudad varchar(50) not null,
    fecha_creacion timestamp default current_timestamp()
) engine=InnoDB;

create table votaciones (
    id int auto_increment primary key,
    id_autor int not null,
    titulo varchar(100) not null,
    descripcion text,
    fecha_creacion timestamp default current_timestamp(),
    fecha_inicio datetime not null,
    fecha_final datetime not null,
    cerrada boolean not null default false,
    razon_cierre text,
    
    foreign key (id_autor) references usuarios(id) on delete cascade on update no action
) engine=InnoDB;

create table opciones (
    id int auto_increment primary key,
    id_votacion int not null,
    nombre_opcion varchar(50) not null,
    desc_opcion text,
    
    foreign key (id_votacion) references votaciones(id) on delete cascade on update no action
) engine=InnoDB;

create table votos (
    id int auto_increment primary key,
    id_votacion int not null,
    id_votante int not null,
    id_opcion int not null,
    fecha_voto timestamp default current_timestamp(),
    
    foreign key (id_votacion) references votaciones(id) on delete cascade on update no action,
    foreign key (id_votante) references usuarios(id) on delete cascade on update no action,
    foreign key (id_opcion) references opciones(id) on delete cascade on update no action,

    unique key unique_voto (id_votacion, id_votante)
) engine=InnoDB;