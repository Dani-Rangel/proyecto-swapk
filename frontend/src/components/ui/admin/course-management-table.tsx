"use client"

import { useEffect, useState } from "react"
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
  Calendar,
} from "lucide-react"
import { CourseDialog } from "./course-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { Curso, CreateCursoData, UpdateCursoData } from "@/services/course"
import type { Usuario } from "@/services/user"
import {
  getCursos,
  createCurso,
  updateCurso,
  deleteCurso,
} from "@/services/course"
import { getUsers } from "@/services/user"

export function CourseManagementTable() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Curso | undefined>()
  const [menuKey, setMenuKey] = useState<number>(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cursoData, userData] = await Promise.all([getCursos(), getUsers()])
        setCursos(cursoData)
        setUsuarios(userData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      }
    }

    fetchData()
  }, [])

  const filteredCursos = cursos.filter((curso) =>
    [curso.titulo, curso.descripcion, curso.objetivo]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  // ✅ Función mejorada: devuelve objeto con nombre, correo y avatar
  const getInstructorInfo = (userId: number) => {
    const instructor = usuarios.find((user) => user.id === userId)
    if (!instructor) {
      return {
        nombre: "Instructor no asignado",
        correo: "",
        avatar: "/img/user.png",
      }
    }
    return {
      nombre: instructor.nombre,
      correo: instructor.correo,
      // Si tienes fotos de perfil, usa: instructor.perfil?.foto
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(instructor.nombre)}`,
    }
  }

  const handleCreateCourse = async (data: CreateCursoData) => {
    try {
      const newCourse = await createCurso(data)
      setCursos((prev) => [...prev, newCourse])
    } catch (error) {
      console.error("Error al crear curso:", error)
    }
  }

  const handleUpdateCourse = async (data: UpdateCursoData) => {
    if (!selectedCourse) return
    try {
      const updated = await updateCurso(selectedCourse.id, data)
      setCursos((prev) =>
        prev.map((curso) => (curso.id === updated.id ? updated : curso))
      )
    } catch (error) {
      console.error("Error al actualizar curso:", error)
    }
  }

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await deleteCurso(courseId)
      setCursos((prev) => prev.filter((curso) => curso.id !== courseId))
    } catch (error) {
      console.error("Error al eliminar curso:", error)
    }
  }

  const openCreateDialog = () => {
    setSelectedCourse(undefined)
    setDialogOpen(true)
  }

  const openEditDialog = (course: Curso) => {
    setSelectedCourse(course)
    setDialogOpen(true)
  }

  const formatDate = (dateString?: string | null) => {
  if (!dateString) return "Fecha no disponible"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Fecha inválida"
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

  return (
    <Card className="bg-[#121212] border-gray-700">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground text-white" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#1e1e1e] text-white border border-blue-700 placeholder:text-gray-500"
              />
            </div>
            <Button onClick={openCreateDialog} className="whitespace-nowrap bg-blue-600 hover:bg-blue-700">
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
                <TableHead className="text-white">Curso</TableHead>
                <TableHead className="text-white">User_Id</TableHead>
                <TableHead className="text-white">Nombre</TableHead>
                <TableHead className="text-white">Objetivo</TableHead>
                <TableHead className="text-white">Fecha</TableHead>
                <TableHead className="w-[80px] text-white">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCursos.map((curso) => {  
                console.log("Curso:", curso)
                return (
                <TableRow key={curso.id} className="hover:bg-[#2a2a2a] transition-colors">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <img
                        src={curso.img_Cursos || "/img/image.png"}
                        alt={curso.titulo}
                        className="w-12 h-12 rounded-md object-cover border border-gray-700"
                        onError={(e) => {
                          e.currentTarget.src = "/img/image.png"
                        }}
                      />
                      <div>
                        <div className="font-medium text-white">{curso.titulo}</div>
                        <div className="text-sm text-gray-400 line-clamp-2">
                          {curso.descripcion}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-white font-mono text-sm">{curso.user_id ?? "Sin instructor"}</span>
                  </TableCell>
                  <span className="text-white font-mono text-sm">{curso.usuario?.nombre || "Sin instructor"}</span>
                  <TableCell>
                    <Badge variant="outline" className="text-xs whitespace-nowrap bg-gray-800 text-white border-gray-700">
                      {curso.objetivo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {formatDate(curso.fecha_creacion)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu key={`${curso.id}-${menuKey}`}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-800"
                          onClick={() => setMenuKey(prev => prev + 1)} // ← ¡ESTA LÍNEA ES CLAVE!
                        >
                          <MoreHorizontal className="h-4 w-4 text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#2a2a2a] border-gray-700 text-white">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            openEditDialog(curso)
                            setMenuKey(prev => prev + 1) // Reinicia después de acción
                          }}
                          className="hover:bg-gray-700 cursor-pointer"
                        >
                          Editar curso
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(curso.titulo)
                            setMenuKey(prev => prev + 1) // Reinicia después de acción
                          }}
                          className="hover:bg-gray-700 cursor-pointer"
                        >
                          Copiar título
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => {
                            handleDeleteCourse(curso.id)
                            setMenuKey(prev => prev + 1) // Reinicia después de acción
                          }}
                          className="text-red-400 hover:bg-gray-700 cursor-pointer"
                        >
                          Eliminar curso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {filteredCursos.length === 0 && (
          
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-2 text-sm font-semibold text-gray-300">No hay cursos</h3>
            <p className="mt-1 text-sm text-gray-500">
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
          onSave={async (data) => {
            if (selectedCourse) {
              await handleUpdateCourse(data as UpdateCursoData)
            } else {
              await handleCreateCourse(data as CreateCursoData)
            }
          }}
          usuarios={usuarios}
        />
      </CardContent>
    </Card>
  )
}