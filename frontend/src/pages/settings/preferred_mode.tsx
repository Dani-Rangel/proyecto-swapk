import { useTranslation } from "../../lib/useTranslations"
import SettingsLayout from "@/components/settings_layout"
import FileManager from "../../components/ui/files_manager"

export default function FilesPage() {
  const { t } = useTranslation()

  return (
    <SettingsLayout title={t("files_title")}>
      <FileManager />
    </SettingsLayout>
  )
}
