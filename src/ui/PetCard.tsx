import { setUi, useOffice } from '../core/store';
import { PET_STAGES, petStage, renamePet, setSpecies, usePet, type Species } from '../pet/petStore';
import { petThePet } from '../pet/petBrain';
import { PetSprite } from '../scene/Pet';
import { Icon } from './bits';

const close = () => setUi({ pet: false });

/** Little card about the office pet: name, species, how big it has grown. */
export function PetCard() {
  const open = useOffice((s) => s.ui.pet);
  const pet = usePet();
  if (!open) return null;
  const stage = petStage(pet.xp);
  const next = PET_STAGES[stage + 1];
  const progress = next ? (pet.xp - PET_STAGES[stage].min) / (next.min - PET_STAGES[stage].min) : 1;

  return (
    <div className="profile pet-card" role="dialog" aria-label={`${pet.name}, the office pet`}>
      <button className="modal-close btn-icon" onClick={close} aria-label="Close">
        <Icon name="close" />
      </button>
      <button className="pet-card-hero" onClick={petThePet} aria-label={`Pet ${pet.name}`}>
        <PetSprite species={pet.species} mode="happy" stage={stage} />
      </button>
      <input className="pet-name" value={pet.name} onChange={(e) => renamePet(e.target.value)} aria-label="Pet name" maxLength={16} />
      <p className="profile-title">
        {PET_STAGES[stage].title} office {pet.species}
      </p>
      <div className="xp big">
        <i style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--primary)' }} />
      </div>
      <p className="profile-next">{next ? `${next.min - pet.xp} snacks until ${next.title}` : 'Fully grown. Wears a crown now.'}</p>
      <div className="seg wide" role="group" aria-label="Species">
        {(['cat', 'pup'] as Species[]).map((sp) => (
          <button key={sp} className={pet.species === sp ? 'on' : ''} onClick={() => setSpecies(sp)}>
            {sp === 'cat' ? 'Cat' : 'Pup'}
          </button>
        ))}
      </div>
      <p className="pet-how">Every finished task is a snack. Tasks on a streak count double. It hides when something breaks and gets the zoomies when the team is on fire.</p>
    </div>
  );
}
