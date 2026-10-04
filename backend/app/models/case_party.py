from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import IdentifiableMixin


class PartyRoleEnum:
    COMPRADOR = "COMPRADOR"
    VENDEDOR = "VENDEDOR"
    DONANTE = "DONANTE"
    DONATARIO = "DONATARIO"
    ARRENDADOR = "ARRENDADOR"
    ARRENDATARIO = "ARRENDATARIO"
    CONTRAYENTE = "CONTRAYENTE"
    SOCIO = "SOCIO"
    REPRESENTANTE_LEGAL = "REPRESENTANTE_LEGAL"
    TESTIGO = "TESTIGO"
    INTERPRETE = "INTERPRETE"
    OTRO = "OTRO"


class CaseParty(Base, IdentifiableMixin):
    """Asociación entre un expediente notarial y una persona individual.

    Permite vincular múltiples comparecientes con roles específicos
    (comprador, vendedor, donante, testigo, etc.) a un expediente.
    """

    __tablename__ = "case_parties"

    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id"), nullable=False, index=True
    )
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id"), nullable=False, index=True
    )
    party_role: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int | None] = mapped_column(default=0)

    # --- Relaciones ---
    case: Mapped["Case"] = relationship("Case", back_populates="parties")
    client: Mapped["Client"] = relationship("Client", back_populates="case_parties")

    def __repr__(self) -> str:
        return f"<CaseParty case={self.case_id} client={self.client_id} role={self.party_role}>"
