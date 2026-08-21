import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

export default function ReportExport({ elementId = "report-content", filename = "Auditoria_Auroria.pdf" }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    const element = document.getElementById(elementId);
    if (!element) {
      alert("Erro: Conteúdo não encontrado para exportação.");
      return;
    }

    setIsExporting(true);
    
    try {
      // Captura o DOM como canvas
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a', // Cor de fundo do Dark Mode
        scale: 2, // Maior qualidade
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // jsPDF(orientation, unit, format)
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao gerar o PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button 
      onClick={handleExportPDF} 
      disabled={isExporting}
      className="bg-tibia-primary hover:bg-blue-600 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition flex items-center"
    >
      <Download size={18} className="mr-2" />
      {isExporting ? 'Gerando PDF...' : 'Exportar Relatório PDF'}
    </button>
  );
}
