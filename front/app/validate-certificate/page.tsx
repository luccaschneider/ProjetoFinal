'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { certificateApi } from '@/lib/api';
import { toast } from 'sonner';
import { FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ValidateCertificatePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      toast.error('Por favor, informe o código do certificado');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await certificateApi.validate(code.trim());
      setResult(data);
      if (data.valid) {
        toast.success('Certificado válido!');
      } else {
        toast.error('Certificado inválido');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao validar certificado';
      setResult({ valid: false, error: errorMessage });
      toast.error('Erro ao validar certificado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Validar Certificado
          </CardTitle>
          <CardDescription>
            Digite o código do certificado para verificar sua autenticidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Código do Certificado</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="Ex: CERT-2024-001234"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleValidate();
                  }
                }}
                disabled={loading}
              />
              <Button onClick={handleValidate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar'
                )}
              </Button>
            </div>
          </div>

          {result && (
            <div className="mt-6">
              {result.valid ? (
                <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                            Certificado Válido
                          </h3>
                          {result.certificate && (
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Código:</span>{' '}
                                <span className="font-mono">{result.certificate.code}</span>
                              </div>
                              <div>
                                <span className="font-medium">Participante:</span>{' '}
                                {result.certificate.usuarioName}
                              </div>
                              <div>
                                <span className="font-medium">Evento:</span>{' '}
                                {result.certificate.eventName}
                              </div>
                              {result.certificate.eventDate && (
                                <div>
                                  <span className="font-medium">Data do Evento:</span>{' '}
                                  {format(new Date(result.certificate.eventDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                  })}
                                </div>
                              )}
                              {result.certificate.issuedAt && (
                                <div>
                                  <span className="font-medium">Emitido em:</span>{' '}
                                  {format(new Date(result.certificate.issuedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-red-500 bg-red-50 dark:bg-red-950">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                          Certificado Inválido
                        </h3>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          {result.error || 'Certificado não encontrado ou inválido'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </main>
    </>
  );
}

