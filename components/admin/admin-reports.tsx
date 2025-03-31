"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { reportedUsers } from "@/lib/auth"
import { Search, MoreHorizontal, Ban, CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AdminReports() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const { toast } = useToast()

  const filteredReports = reportedUsers.filter(
    (report) =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleBanUser = () => {
    if (!selectedReportId) return

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Utilisateur banni",
        description: "L'utilisateur a été banni avec succès.",
      })

      setIsBanDialogOpen(false)
      setSelectedReportId(null)
    }, 500)
  }

  const handleDismissReport = (reportId: string) => {
    toast({
      title: "Signalement ignoré",
      description: "Le signalement a été marqué comme traité.",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un signalement..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead>Signalé par</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.name}</TableCell>
                <TableCell>{report.email}</TableCell>
                <TableCell>
                  <Badge variant="destructive">{report.reason}</Badge>
                </TableCell>
                <TableCell>Utilisateur #{report.reportedBy}</TableCell>
                <TableCell>
                  {report.date.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Ouvrir le menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedReportId(report.id)
                          setIsBanDialogOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Bannir l'utilisateur
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDismissReport(report.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Ignorer le signalement
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Envoyer un avertissement
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le bannissement</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir bannir cet utilisateur ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              Bannir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

