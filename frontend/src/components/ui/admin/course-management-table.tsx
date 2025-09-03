"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  Plus,
  Search,
  BookOpen,
  User,
  Calendar,
} from "lucide-react"
import type { Curso, CreateCursoData, UpdateCursoData } from "@/services/course"
import type { Usuario } from "@/services/user"
import { CourseDialog } from "./course-dialog"

// Mock data para cursos
const mockCursos: Curso[] = [
  {
    id: 1,
    titulo: "Introducción a React",
    descripcion: "Aprende los fundamentos de React desde cero.",
    objetivo: "Dominar los conceptos básicos de React",
    User_Id: 1,
    img_Cursos: "https://placehold.co/300x200?text=React",
    fecha_creacion: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    titulo: "JavaScript Avanzado",
    descripcion: "Profundiza en conceptos como closures y async.",
    objetivo: "Convertirse en un desarrollador experto",
    User_Id: 2,
    img_Cursos: "https://placehold.co/300x200?text=JavaScript",
    fecha_creacion: "2024-01-20T14:30:00Z",
  },
  {
    id: 3,
    titulo: "Diseño UX/UI",
    descripcion: "Diseña interfaces intuitivas y experiencias excepcionales.",
    objetivo: "Crear diseños centrados en el usuario",
    User_Id: 1,
    img_Cursos: "https://placehold.co/300x200?text=UX+UI",
    fecha_creacion: "2024-02-01T09:15:00Z",
  },
]

const mockUsuarios: Usuario[] = [
  {
    id: 1,
    nombre: "Ana García",
    correo: "ana@ejemplo.com",
    rol: "Administrador" as any,
    fecha_creacion: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    nombre: "Carlos López",
    correo: "carlos@ejemplo.com",
    rol: "Moderador" as any,
    fecha_creacion: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    nombre: "María Rodríguez",
    correo: "maria@ejemplo.com",
    rol: "Usuario" as any,
    fecha_creacion: "2024-01-01T00:00:00Z",
  },
]

export function CourseManagementTable() {
  const [cursos, setCursos] = useState<Curso[]>(mockCursos)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Curso | undefined>()

  const filteredCursos = cursos.filter((curso) =>
    [curso.titulo, curso.descripcion, curso.objetivo]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const getInstructorName = (userId: number) => {
    const instructor = mockUsuarios.find((user) => user.id === userId)
    return instructor ? instructor.nombre : "Instructor no encontrado"
  }

  const handleCreateCourse = (data: CreateCursoData) => {
    const newCourse: Curso = {
      id: Math.max(...cursos.map((c) => c.id)) + 1,
      ...data,
      fecha_creacion: new Date().toISOString(),
    }
    setCursos([...cursos, newCourse])
  }

  const handleUpdateCourse = (data: UpdateCursoData) => {
    if (!selectedCourse) return
    setCursos(
      cursos.map((curso) =>
        curso.id === selectedCourse.id ? { ...curso, ...data } : curso
      )
    )
  }

  const handleDeleteCourse = (courseId: number) => {
    setCursos(cursos.filter((curso) => curso.id !== courseId))
  }

  const openCreateDialog = () => {
    setSelectedCourse(undefined)
    setDialogOpen(true)
  }

  const openEditDialog = (course: Curso) => {
    setSelectedCourse(course)
    setDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <BookOpen className="h-5 w-5" />
              Gestión de Cursos
            </CardTitle>
            <CardDescription className="text-gray-400">
              Administra los cursos disponibles en la plataforma
            </CardDescription>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#1e1e1e] text-white border border-gray-700"
              />
            </div>
            <Button onClick={openCreateDialog} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Curso
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-md border border-gray-700 bg-[#1e1e1e] text-white">
          <Table>
            <TableHeader className="bg-[#2a2a2a]">
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCursos.map((curso) => (
                <TableRow key={curso.id} className="hover:bg-[#2a2a2a]">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <img
                        src={curso.img_Cursos || "/placeholder.svg"}
                        alt={curso.titulo}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                      <div>
                        <div className="font-medium text-white">{curso.titulo}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {curso.descripcion}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {getInstructorName(curso.User_Id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {curso.objetivo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(curso.fecha_creacion).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(curso)}>
                          Editar curso
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard.writeText(curso.titulo)
                          }
                        >
                          Copiar título
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteCourse(curso.id)}
                          className="text-destructive"
                        >
                          Eliminar curso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredCursos.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No hay cursos</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm
                ? "No se encontraron cursos con ese término de búsqueda."
                : "Comienza creando tu primer curso."}
            </p>
          </div>
        )}

        <CourseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          course={selectedCourse}
          onSave={selectedCourse ? handleUpdateCourse : handleCreateCourse}
          usuarios={mockUsuarios}
        />
      </CardContent>
    </Card>
  )
}
