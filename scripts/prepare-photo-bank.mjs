import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
try{
 const existing=JSON.parse(await readFile(resolve(root,'assets/photo-bank/manifest.json'),'utf8'));
 if(existing.generated>0)throw new Error('The photo bank already contains generated assets. Keep its manifest and extend it deliberately instead of resetting it.');
}catch(error){if(error.code!=='ENOENT')throw error;}
const audit=JSON.parse(await readFile(resolve(root,'assets/photo-bank/priority-audit.json'),'utf8'));
const catalog=JSON.parse(await readFile(resolve(root,'src/catalog-data.json'),'utf8'));
// Materials are chosen for counting pieces. Weight, money, route and length
// lessons receive their own separate cases below; a photograph is never data.
const stock={
groen:`tulpen|de bloemenwinkel|fresh cut tulips on a florist workbench
terracotta potten|de kwekerij|small terracotta pots on a nursery trolley
handschoenen|het hoveniersbedrijf|pairs of gardening gloves on a potting bench
aardbeienbakjes|de fruitkwekerij|empty berry punnets beside freshly harvested strawberries
rozen|de bloemenwinkel|cut rose stems on a florist packing table
klinkers|het bestratingsbedrijf|concrete paving bricks in a sand yard
waterkoppelingen|het beregeningsbedrijf|loose irrigation hose connectors in a greenhouse
voerbakjes|de kinderboerderij|clean small animal feed bowls on a barn shelf
haagplanten|het hoveniersbedrijf|young bare-root hedge plants beside a garden van
emmerboeketten|de bloemenveiling|flower bunches in transport buckets at a flower auction
kunststof potten|het tuincentrum|stackable plant pots in a garden centre
zonnebloemen|de bloemenwinkel|cut sunflowers on a florist counter
boomankers|het hoveniersbedrijf|tree anchoring straps beside new orchard trees
plantclips|de tomatenkwekerij|small tomato plant support clips on a greenhouse cart
appels|de fruitboerderij|fresh apples in wooden harvest crates
schorszakken|het tuincentrum|unbranded bags of bark mulch on a garden centre pallet
gieters|de kwekerij|small green watering cans beside nursery benches
steunen|het hoveniersbedrijf|bamboo plant support stakes beside potted climbers
eieren|de boerderijwinkel|eggs in cardboard trays at a farm shop
koolplanten|de groentekwekerij|young cabbage plants in nursery trays
bloembollen|het tuincentrum|loose flower bulbs in shallow wooden bins
voerlepels|de dierenopvang|clean animal feed scoops in an animal shelter storeroom
dahlia's|de snijbloemenkwekerij|fresh cut dahlia flowers on a harvest cart
werkemmers|het hoveniersbedrijf|sturdy plastic work buckets beside a paving job
plantenringen|de kwekerij|metal plant support rings on a greenhouse bench
zaaibakjes|de groentekwekerij|empty seedling trays beside bags of potting compost
drinkbakjes|de dierenopvang|clean rabbit drinking dishes in an animal care storeroom
lavendelplanten|het tuincentrum|lavender plants in small nursery pots
gronddoekpennen|het hoveniersbedrijf|U-shaped landscape fabric pegs in a tray beside a planted border
voederballen|de dierenwinkel|unwrapped wild bird fat balls in a shop tray
potonderzetters|het tuincentrum|round terracotta plant saucers on a retail shelf
waterdruppelaars|de plantenkwekerij|drip irrigation emitters in an open greenhouse parts box
fruitkratten|de boomgaard|empty plastic harvest crates beside orchard apple trees
bloemvaasjes|de bloemenwinkel|small clear glass vases on a florist table
boompalen|het hoveniersbedrijf|wooden tree stakes lying beside a newly planted tree
kruidenplanten|de kruidenkwekerij|small basil plants on a nursery packing bench`,
techniek:`bouten|de autogarage|steel hex bolts in a garage parts tray
moeren|het metaalbedrijf|hexagonal nuts in a metal workshop bin
kabelbinders|het installatiebedrijf|black cable ties on an electrician workbench
fietsbelletjes|de fietsenmakerij|bicycle bells on a bike repair counter
sluitringen|het montagebedrijf|steel washers in a mechanical assembly tray
kabelclips|het installatiebedrijf|white cable clips in an electrician parts organiser
scharnieren|het meubelbedrijf|small cabinet hinges on a carpentry workbench
bandventielen|de bandenwerkplaats|rubber tyre valves in a garage service tray
stekkers|het installatiebedrijf|unbranded electrical plug housings on a bench with no wiring exposed
handgrepen|het keukenmontagebedrijf|cabinet handles beside wooden cabinet doors
verfrollers|het schildersbedrijf|unused small paint rollers on a decorating bench
deurknoppen|het onderhoudsbedrijf|round door knobs in a maintenance workshop
houtblokken|de timmerwerkplaats|small rectangular timber blocks on a carpenter bench
schuurvellen|het meubelbedrijf|sandpaper sheets beside a wooden chair under restoration
fietsremblokjes|de fietsenmakerij|bicycle brake pads on a cycle workshop table
spanbanden|het transportbedrijf|rolled cargo securing straps in a vehicle depot
zekeringhouders|het installatiebedrijf|unconnected plastic fuse holders in an electrical workshop
montagebeugels|het montagebedrijf|metal L brackets on an assembly table
kwasten|het schildersbedrijf|clean paint brushes in an open tool tote
afdekdoppen|het metaalbedrijf|round protective plastic end caps beside metal tubes
deurstoppen|het onderhoudsbedrijf|rubber door stops in a facility maintenance storeroom
slangklemmen|de autogarage|metal hose clamps in a garage compartment tray
plankdragers|het timmerbedrijf|shelf support brackets beside an unfinished wooden shelf
schroevendraaiers|de gereedschapswinkel|screwdrivers on a tool shop counter
wielen|het montagebedrijf|small furniture castor wheels on an assembly bench
lasbrillen|het metaalbedrijf|protective welding goggles on a safety equipment shelf
werkhandschoenen|het bouwbedrijf|work gloves on a construction stores counter
fietspedalen|de fietsenmakerij|bicycle pedals in a repair parts bin
boorkoppen|het gereedschapsbedrijf|drill chucks on a machinery supply workbench
schuurblokjes|het timmerbedrijf|rectangular sanding blocks on a woodworking bench
accuhouders|het installatiebedrijf|empty battery mounting holders on a workbench
kabeldoorvoeren|het montagebedrijf|rubber cable grommets in a sorting tray
veiligheidsbrillen|de werkplaats|clear safety spectacles on a workshop equipment shelf
viltglijders|het meubelbedrijf|felt furniture pads on an upholstery worktable
verfbeugels|het schildersbedrijf|metal roller frames on a paint workshop table
fietsspatborden|de fietsenmakerij|bicycle mudguards beside a bicycle repair stand`,
zw:`washandjes|de linnenkamer|clean folded washcloths in a care home linen room
drinkbekers|de huiskamer|reusable drinking cups on a care home dining trolley
zeepjes|het woonzorgcentrum|wrapped unbranded soap bars in a care facility supply room
placemats|de eetzaal|washable placemats on a care home dining service cart
tandenborstels|de zorgwinkel|unbranded toothbrushes in sealed clear wrappers on a supply counter
keukendoeken|de personeelskeuken|folded kitchen cloths in a care home pantry
schoonmaaksponsjes|de schoonmaakdienst|clean sponges beside an organised housekeeping trolley
kussenslopen|de linnenkamer|freshly folded pillowcases beside linen shelves
theekopjes|de huiskamer|porcelain teacups on a resident lounge tea trolley
flessen handzeep|de facilitaire dienst|plain pump bottles of hand soap on a supply shelf
waszakken|de wasserij|clean fabric laundry bags beside a laundry sorting table
ontbijtbordjes|de eetzaal|small breakfast plates on a care home buffet trolley
tafelkaartjes|de activiteitenruimte|blank folded place cards beside activity craft materials
schoonmaakdoeken|de schoonmaakdienst|colour coded microfibre cleaning cloths on a housekeeping table
haarborstels|de zorgwinkel|new hairbrushes in a care products storeroom
dekens|de linnenkamer|folded fleece blankets on care home storage shelves
kommen|de huiskamer|small soup bowls on a resident dining trolley
bloempotjes|de activiteitenruimte|small flower pots for a care home gardening activity
drinkflesjes|de dagbesteding|refillable water bottles on an outing preparation table
beddengoedsets|de wasserij|bundles of clean bed linen on a wheeled laundry cart
servethouders|de eetzaal|small table napkin holders on a dining service shelf
pantoffels|de zorgwinkel|pairs of soft slippers in a care supply stockroom
kwasten|de activiteitenruimte|clean craft paintbrushes beside a care home art activity table
broodmandjes|de eetzaal|small woven bread baskets on a breakfast preparation counter
shampooflessen|het woonzorgcentrum|plain unbranded shampoo bottles on a toiletries supply shelf
afwasteiltjes|de huishoudelijke dienst|small plastic washing up bowls in a care facility utility room
sokken|de wasserij|folded pairs of clean socks on a laundry sorting bench
handdoeken|de linnenkamer|fresh folded towels on a care home linen trolley
waterkannen|de huiskamer|clear water pitchers on a care home drinks preparation trolley
poetsborstels|de schoonmaakdienst|clean scrubbing brushes on a housekeeping supply shelf
borduurringen|de activiteitenruimte|wooden embroidery hoops on an activity workshop table
theedozen|de huiskamer|plain tea storage tins beside a care home tea trolley
slabben|de linnenkamer|folded washable adult dining bibs on a care home utility shelf
bloemvaasjes|de huiskamer|small glass flower vases on a care home dining preparation table
badmatten|de wasserij|folded clean bathroom mats in a laundry room
opbergmandjes|de huishoudelijke dienst|small woven storage baskets on a care facility stores counter`,
hbr:`broodjes|het cateringbedrijf|fresh bread rolls on a catering preparation table
glazen|het restaurant|clean drinking glasses in a restaurant service area
dessertlepels|het restaurant|polished dessert spoons on a service preparation counter
koffiekopjes|het hotel|white coffee cups beside a hotel breakfast service station
muffins|de bakkerij|fresh muffins in a professional bakery tray
sausschaaltjes|de restaurantkeuken|small empty sauce ramekins on a commercial kitchen pass
eieren|de bakkerij|eggs in cardboard flats on a bakery preparation bench
theelepels|het lunchrestaurant|polished teaspoons on a restaurant service bench
appelgebakjes|de banketbakkerij|individual apple pastries in a bakery display preparation area
soepkommen|het restaurant|white soup bowls on a restaurant kitchen shelf
dienbladen|het hotel|clean service trays in a hotel food service station
croissants|de hotelkeuken|fresh croissants on a hotel breakfast preparation tray
ijscoupes|de ijssalon|empty glass ice cream bowls on an ice cream shop counter
koekjes|de bakkerij|fresh cookies on a bakery cooling rack
broodmandjes|het restaurant|small woven bread baskets beside a restaurant service station
limonadeflessen|het cateringbedrijf|unbranded sealed fruit drink bottles in a catering storeroom
dinerborden|het restaurant|white dinner plates beside a commercial dishwasher
theezakjes|het hotel|plain individually wrapped tea sachets on a hotel breakfast cart
bananen|de lunchkeuken|ripe bananas on a professional catering fruit preparation bench
weckpotjes|het lunchrestaurant|small glass preserving jars on a lunch kitchen counter
serveertangen|het buffetrestaurant|stainless steel serving tongs beside a buffet setup station
tomaten|de restaurantkeuken|fresh tomatoes in shallow produce crates in a commercial kitchen
taartbordjes|de banketbakkerij|small pastry plates on a bakery cafe service counter
drinkpakjes|het cateringbedrijf|plain small beverage cartons in a catering packing area
afhaalbakjes|het lunchrestaurant|empty takeaway food containers on a restaurant packing counter
bakvormpjes|de bakkerij|small metal baking moulds on a bakery workbench
vorken|het restaurant|polished table forks on a restaurant preparation table
paprika's|de restaurantkeuken|fresh bell peppers on a commercial kitchen preparation counter
soepbekers|het cateringbedrijf|empty takeaway soup cups in a catering supply area
cakes|de bakkerij|small loaf cakes on a professional bakery cooling table
melkkannetjes|het hotel|small stainless steel milk pitchers on a hotel breakfast counter
snijplanken|de restaurantkeuken|colour coded cutting boards on a commercial kitchen equipment shelf
waterkarafjes|het restaurant|clear glass water carafes on a restaurant service station
flessen appelsap|het cateringbedrijf|unbranded apple juice bottles in a catering drinks store
maatlepels|de bakkerij|stainless steel measuring spoons on a bakery bench
keukenschorten|het restaurant|folded clean kitchen aprons in a restaurant linen store`,
eco:`blikken soep|de supermarkt|unbranded tins of soup on a supermarket replenishment trolley
notitieboeken|de kantoorwinkel|plain notebooks on a stationery shop packing table
rollen plakband|het magazijn|clear packing tape rolls on a warehouse dispatch bench
flessen sap|de supermarkt|unbranded fruit juice bottles on a shop stock cart
sokken|de kledingwinkel|folded pairs of socks on a clothing shop stockroom table
koffiemokken|de woonwinkel|ceramic coffee mugs on a housewares shop shelf
enveloppen|de kantoorwinkel|plain envelopes in a stationery stockroom tray
batterijverpakkingen|de winkel|unbranded sealed battery packs on a retail replenishment trolley
theedoeken|de woonwinkel|folded tea towels on a household goods packing table
potloden|de kantoorwinkel|wooden pencils on a stationery shop sorting counter
zeepflessen|de drogisterij|plain hand soap bottles on a drugstore stock trolley
broodtrommels|de huishoudwinkel|plain reusable lunchboxes on a housewares shop counter
boeken|de boekhandel|plain covered books on a bookshop unpacking bench
paraplu's|de warenwinkel|folded umbrellas in a department store stock basket
kaarsen|de woonwinkel|plain pillar candles on a home decor shop shelf
keukensponsjes|de supermarkt|unbranded kitchen sponges on a supermarket stockroom table
knijpers|de huishoudwinkel|wooden clothes pegs in a household goods shop bin
telefoonhoesjes|de telefoonwinkel|plain mobile phone cases in a shop stock organiser
waterflessen|de sportwinkel|unbranded reusable sports bottles on a retail shelf
tassen|de kledingwinkel|plain folded reusable shopping bags on a store counter
brievenbakjes|de kantoorwinkel|plastic document trays in an office supply stockroom
fotolijstjes|de woonwinkel|small photo frames on a homeware shop packing bench
cadeaulintrollen|de cadeauwinkel|spools of gift ribbon on a gift shop wrapping table
petten|de kledingwinkel|plain baseball caps on a clothing store stock cart
borstels|de huishoudwinkel|household cleaning brushes in a retail stockroom
inpakvellen|de cadeauwinkel|folded plain gift wrapping sheets on a shop wrapping counter
handschoenen|de bouwmarkt|pairs of work gloves on a hardware shop replenishment trolley
ringenmappen|de kantoorwinkel|plain ring binders on a stationery shop stock shelf
bekers|de kampeerwinkel|reusable camping cups on a camping shop display preparation table
haarelastiekjes|de drogisterij|plain hair elastics in a drugstore stock organiser
onderzetters|de woonwinkel|round drink coasters on a household goods counter
bezems|de huishoudwinkel|new broom heads in a housewares shop stockroom
etiketrollen|het magazijn|blank adhesive label rolls on a warehouse packing bench
sjaals|de kledingwinkel|folded plain scarves on a clothing shop stock table
plantenpotten|de woonwinkel|small decorative ceramic plant pots on a homeware shop shelf
wasmandjes|de huishoudwinkel|small laundry baskets in a household goods shop aisle`
};
const sectors={groen:'Groen',techniek:'Techniek',zw:'Zorg en Welzijn',hbr:'Horeca, Bakkerij en Recreatie',eco:'Economie'};
const actions={
bridge:['Je voegt een levering bij de spullen die er al liggen.','adding a newly delivered batch to existing stock'],
ratioViaOne:['Je zoekt uit hoeveel materiaal bij een nieuwe bestelling hoort.','preparing matching material kits for a new order'],
count:['Je telt volle groepjes en losse stuks.','checking bundled stock and loose pieces'],
divide:['Je verdeelt de spullen over de bakken voor je collega’s.','distributing items into matching shallow work trays'],
half:['Je zet een deel van de voorraad klaar.','moving part of the available stock onto a dispatch tray'],
quarter:['Je houdt een deel van de voorraad apart.','selecting a portion of stock for a separate order'],
ratioScale:['Je maakt meer sets voor een grotere opdracht.','laying out repeat sets of materials for a larger order'],
sets:['Je legt het materiaal voor de sets klaar.','assembling matching work kits at a preparation station'],
sub:['Je pakt spullen uit de voorraad voor een klus.','taking materials from a stock bin for a job'],
columnAdd:['Er komt een nieuwe levering bij. Je telt de voorraad op.','unpacking a delivery beside an existing stock tray'],
columnSub:['Je haalt een bestelling uit de voorraad.','picking an order from a stock shelf into an open box'],
diff:['Je vergelijkt hoeveel er op twee plekken ligt.','comparing stock in neighbouring storage locations'],
estimate:['Je schat eerst hoeveel er ligt. Daarna tel je precies.','surveying open supply crates before a precise inventory check'],
pack:['Je pakt de bestelling in bakken in.','packing a consignment into reusable transport containers'],
percentPart:['Je zet een deel van de voorraad apart.','reserving a portion of stock for a colleague'],
refill:['Je vult de werkvoorraad aan.','replenishing a partly empty storage location'],
stock:['Er komt voorraad bij en er gaat voorraad uit.','checking incoming and outgoing supplies at a dispatch station'],
both:['Je verdeelt de bestelling over transportbakken.','filling transport containers with items from a workbench'],
countCheck:['Je controleert of de telling op de lijst klopt.','checking items against a clipboard turned away from the camera'],
double:['Voor een grotere opdracht heb je meer nodig.','preparing an additional matching batch beside an existing order'],
doubleList:['Je maakt de bestelling groter. Gebruik de aantallen op de lijst.','laying out an additional batch of materials for a larger job'],
halfList:['Je maakt de bestelling kleiner. Gebruik de aantallen op de lijst.','returning part of an order to a stock shelf'],
multiply:['Je zet gelijke groepen materiaal klaar.','arranging matching work trays for repeated jobs'],
need:['Je controleert hoeveel spullen nog ontbreken.','checking a partly filled preparation trolley against available stock'],
perSet:['Je stelt sets samen voor een opdracht.','putting matching individual materials into reusable kit boxes'],
ratioRead:['Je controleert hoeveel materiaal bij een set hoort.','checking components laid out for a prepared work kit'],
ratioUnit:['Je zoekt uit wat je voor één set nodig hebt.','isolating a sample work kit from a larger order'],
reservePercent:['Je houdt extra materiaal achter voor later.','placing spare stock on a separate reserve shelf'],
rest:['Je pakt volle bakken in en houdt de rest apart.','packing full transport trays with remaining items alongside'],
round:['Je geeft een schatting van de voorraad door.','surveying a partly visible stock cart to estimate the consignment'],
stockShortage:['Je zoekt uit wat je nog moet bijbestellen.','checking a sparse stock shelf beside an open delivery crate'],
estimateEnough:['Je schat of er genoeg materiaal is.','comparing available stock with preparation trays for a job'],
tenPercent:['Je zet een deel van de voorraad opzij.','separating a small reserve of material from the main stock'],
twentyPercent:['Je houdt materiaal apart voor een volgende taak.','loading a reserve tray beside a larger main consignment'],
tripleList:['Je bereidt materiaal voor een grotere opdracht voor.','preparing repeated material kits for a larger work order'],
fractionPicture:['Je verdeelt de voorraad in delen.','sorting supplies into matching shallow compartment trays'],
percentPicture:['Je bekijkt welk deel van de voorraad je nodig hebt.','setting aside selected materials beside the remaining stock']
};
const dataActions={
barDifference:'Je vergelijkt de voorraad op twee plekken.',stockTable:'Je kijkt op de lijst wat je moet aanvullen.',tableDifference:'Je vergelijkt de aantallen op de lijst.',tallyRead:'Je controleert de telling met de turflijst.',average:'Je bekijkt hoeveel spullen er per dag klaar zijn.',averageDecision:'Je controleert of er per dag genoeg klaar is.',barMinimum:'Je zoekt waar de kleinste voorraad ligt.',barRead:'Je leest de voorraad af uit de grafiek.',barScale:'Je bekijkt hoeveel stuks een stap in de grafiek voorstelt.',barStock:'Je zoekt waar de meeste voorraad bij moet.',checkBar:'Je controleert de grafiek met de lijst.',dataDecision:'Je beslist waar je eerst moet bijvullen.',deviation:'Je vergelijkt de echte voorraad met het aantal op de lijst.',drawBar:'Je zet de getelde aantallen in een grafiek.',lineChange:'Je bekijkt hoe de voorraad per dag verandert.',lineMost:'Je zoekt op welke dag de voorraad het meest verandert.',lineRead:'Je leest de voorraad per dag uit de grafiek.',selectData:'Je zoekt het juiste aantal op de voorraadlijst.',stockDifference:'Je vergelijkt de voorraad met wat je nodig hebt.',stockOrder:'Je zoekt uit hoeveel je moet bestellen.',stockRead:'Je leest af hoeveel voorraad er ligt.',sumValues:'Je telt de aantallen van de werkdagen bij elkaar.',tableBar:'Je vergelijkt een lijst met een grafiek.',tableCompare:'Je vergelijkt de voorraad op verschillende plekken.',tableRead:'Je zoekt een aantal op in de tabel.',tableUnit:'Je kijkt welke eenheid bij de aantallen hoort.',tallyMake:'Je telt de spullen en zet turfstreepjes op een lijst.'};
const roles={groen:'medewerker groen',techniek:'werkplaatsmedewerker',zw:'ondersteunend medewerker',hbr:'horecamedewerker',eco:'winkelmedewerker'};
const length={
groen:['een tuinrand|een tuin in aanleg|a straight garden edging timber beside a planted border','een boomsteun|de boomgaard|wooden orchard tree support stakes on a workbench','een tuinslang|de kwekerij|a plain flexible irrigation hose beside a greenhouse bench'],
techniek:['een montagelat|de timmerwerkplaats|a wooden mounting batten beside an unfinished cabinet','een buis|het installatiebedrijf|plain plumbing pipe lengths on a workshop bench','een afwerkstrip|het montagebedrijf|metal trim strips beside an assembly frame'],
zw:['een plank|de linnenkamer|a wooden linen cupboard shelf beside clean towels','een tafelloper|de huiskamer|a plain fabric runner beside a care home dining table','een gordijnrail|de onderhoudsdienst|an unmarked curtain rail on a facility maintenance bench'],
hbr:['een buffettafel|het restaurant|a rectangular buffet table being prepared for service','een rol bakpapier|de bakkerij|a plain roll of baking paper on a bakery bench','een afwerkstrook|de hotelkeuken|a stainless steel trim strip beside a kitchen shelf'],
eco:['een winkelschap|de woonwinkel|a retail shelf board beside an empty display unit','een stuk cadeaulint|de cadeauwinkel|a length of plain gift ribbon on a shop wrapping table','een inpakrol|het magazijn|a plain roll of kraft wrapping paper on a dispatch bench']};
const money={
groen:['bloemzaad|de tuinwinkel|plain flower seed packets on a garden shop checkout counter','een snoeischaar|het tuincentrum|unbranded pruning shears on a garden centre checkout counter','compostzakken|de tuinwinkel|plain bags of compost beside a garden shop checkout','tuinhandschoenen|het tuincentrum|garden gloves being purchased at a garden centre counter','plantenpotten|de tuinwinkel|terracotta plant pots on a garden shop checkout','bloemboeketten|de bloemenwinkel|fresh flower bouquets at a florist payment counter','graszaad|de tuinwinkel|plain grass seed bags in different package sizes on a garden shop counter'],
techniek:['schroeven|de bouwmarkt|plain boxes of screws on a hardware store checkout','een rolmaat|de gereedschapswinkel|an unbranded closed tape measure on a tool shop payment counter','fietsbanden|de fietsenwinkel|boxed bicycle inner tubes at a bike shop checkout','werkhandschoenen|de bouwmarkt|pairs of work gloves being purchased at a hardware shop','montagebeugels|de bouwmarkt|metal brackets on a hardware store checkout counter','verfkwasten|de verfwinkel|paint brushes on a decorating supply shop checkout','schuurvellen|de gereedschapswinkel|plain sandpaper packs of different sizes on a tool shop counter'],
zw:['toiletspullen|de drogisterij|unbranded toiletries on a drugstore payment counter','een drinkbeker|de huishoudwinkel|a reusable drinking mug on a household shop checkout','schoonmaakdoeken|de huishoudwinkel|folded cleaning cloths at a household goods checkout','handdoeken|de woonwinkel|folded hand towels being purchased at a homeware counter','handzeep|de drogisterij|plain hand soap bottles on a drugstore counter','knutselspullen|de hobbywinkel|craft materials on a hobby shop payment counter','washandjes|de woonwinkel|plain packs of washcloths in different pack sizes on a homeware counter'],
hbr:['broodjes|de bakkerij|fresh bread rolls being purchased at a bakery counter','koffie|het lunchrestaurant|a cup of coffee at a cafe payment counter','fruit|de groothandel|fresh fruit crates at a catering wholesaler checkout','koekjes|de bakkerij|bakery cookies offered at a bakery sales counter','koffiebonen|de groothandel|plain unbranded coffee bean bags at a wholesaler counter','gebakjes|de banketbakkerij|small pastries at a bakery payment counter','thee|de groothandel|plain tea boxes of different package sizes on a catering wholesaler counter'],
eco:['boodschappen|de supermarkt|plain grocery items at a supermarket checkout conveyor','een notitieboek|de kantoorwinkel|a plain notebook at a stationery shop payment counter','keukendoeken|de woonwinkel|folded kitchen towels at a housewares checkout','een rugtas|de tassenwinkel|a plain backpack offered at a bag shop payment counter','mokken|de woonwinkel|ceramic mugs being purchased at a homeware counter','pennen|de kantoorwinkel|pens on a stationery shop checkout counter','batterijen|de winkel|plain battery packs in different pack sizes at a shop checkout']};
const time={groen:['jonge planten|de kwekerij|watering nursery plants with a hose','tuinmateriaal|het hoveniersbedrijf|loading gardening tools into a work van'],techniek:['fietsremmen|de fietsenmakerij|checking a bicycle brake on a repair stand','montagemateriaal|het montagebedrijf|preparing a tidy mechanical assembly workbench'],zw:['handdoeken|de linnenkamer|putting fresh linen on a care home trolley','ontbijtspullen|de eetzaal|preparing a care home breakfast service trolley'],hbr:['broodjes|het cateringbedrijf|preparing filled sandwiches on a commercial kitchen bench','buffetspullen|het restaurant|setting up a restaurant buffet station'],eco:['winkelartikelen|het magazijn|packing orders at a retail dispatch station','boodschappen|de supermarkt|restocking a supermarket shelf from a rolling cart']};
const route={groen:['een looproute|de kwekerij|an aisle between nursery greenhouse plant benches','een werkvak|het hoveniersbedrijf|a rectangular garden work area viewed obliquely from above'],techniek:['een looproute|de autogarage|a clear walkway through an organised auto service workshop','een montageplek|het montagebedrijf|an assembly workshop interior with a clear rectangular floor area'],zw:['een looproute|het woonzorgcentrum|a clear care home service corridor with a linen trolley','een activiteitenruimte|het woonzorgcentrum|a rectangular care home activity room ready to furnish'],hbr:['een looproute|het hotel|a hotel service corridor leading towards a dining room','een buffetplek|het restaurant|a rectangular restaurant buffet area before setup'],eco:['een looproute|het magazijn|a warehouse aisle between retail stock shelves','een winkelvak|de woonwinkel|a rectangular shop display floor area before furnishing']};
const moneyKinds=['priceAdd','budget','change','discountFinal','offerCompare','priceMultiply','unitPriceCompare'];
const records=[];
for(const [sector,label]of Object.entries(sectors)){
 const items=stock[sector].split('\n').map(s=>s.split('|'));let stockIndex=0;
 for(const [index,l]of audit.selected.entries()){
  let tuple,action,english;
  if(moneyKinds.includes(l.kind)){
   tuple=money[sector][moneyKinds.indexOf(l.kind)].split('|');
   const ma={priceAdd:'Je telt de prijzen van de boodschappen op.',budget:'Je kiest wat je met het beschikbare geld kunt kopen.',change:'Je controleert het geld dat je terugkrijgt.',discountFinal:'Je bekijkt wat het product na korting kost.',offerCompare:'Je vergelijkt twee aanbiedingen.',priceMultiply:'Je rekent uit wat de hele bestelling kost.',unitPriceCompare:'Je vergelijkt de prijs per stuk van twee verpakkingen.'};
   action=ma[l.kind];english='a natural close-up at the payment counter, items clearly visible, a generic payment terminal with its screen turned away, no banknotes or coins';
  }else if(['duration','startTimePrep'].includes(l.kind)){
   tuple=time[sector][l.kind==='duration'?0:1].split('|');action=l.kind==='duration'?'Je controleert hoelang de werktaak duurt.':'Je plant wanneer je moet beginnen om op tijd klaar te zijn.';english='the real work task in progress, no clocks, no visible timers, no calendar';
  }else if(['gridDistance','scaleLength'].includes(l.kind)){
   tuple=route[sector][l.kind==='gridDistance'?0:1].split('|');action=l.kind==='gridDistance'?'Je controleert de route voordat je materiaal wegbrengt.':'Je bekijkt de ruimte en vergelijkt die met de plattegrond.';english='show the real space clearly, no drawn maps or readable signs';
  }else if(['decimalCompare','decimalEqual','decimalLimit'].includes(l.kind)){
   tuple=length[sector][['decimalCompare','decimalEqual','decimalLimit'].indexOf(l.kind)].split('|');action='Je controleert de lengte voordat je het materiaal gebruikt.';english='the material fully recognisable beside a coiled tape with its scale not visible; length values are supplied separately in the lesson';
  }else{
   tuple=items[stockIndex++%items.length];
   const pair=actions[l.kind];
   action=pair?.[0]||dataActions[l.kind]||'Je controleert de voorraad voor de volgende werktaak.';
   english=pair?.[1]||(['tallyRead','tallyMake'].includes(l.kind)?'an inventory check in progress, a worker with a clipboard seen from the back, paper writing not visible':'a practical inventory check with open storage bins and a clipboard lying face-down');
   if(l.kind==='line'){action='Je zoekt het juiste aantal op de getallenlijn bij de werkbon.';english='sorting a partial consignment into storage trays, no number labels';}
  }
  const [material,place,subject]=tuple;
  const id=sector+'-'+String(index+1).padStart(3,'0')+'-'+l.kind.toLowerCase();
  const matches=catalog.entries.filter(e=>e.kind===l.kind);
  const context='Je werkt in '+place+'. '+action;
  const framing=['three-quarter view at bench height','close oblique overhead view','eye-level view along the workbench','wide close-up showing hands and the working surface'][index%4];
  records.push({id,sector,sectorName:label,kind:l.kind,title:l.title,priority:l.priority,reason:l.priority===1?'Bij dit lesonderwerp ontbreekt een eigen passende beroepsfoto.':'De bestaande foto wordt bij meerdere verschillende lessen gebruikt.',material,place,role:roles[sector],context,alt:material+' tijdens het werk in '+place,lessonIds:matches.map(e=>e.id),weeks:[...new Set(matches.map(e=>'PrO '+(e.year+2)+' · week '+e.week))],file:id+'.webp',sheet:sector+'-'+(Math.floor(index/16)+1),cell:index%16,scene:subject+'. '+english+'. '+framing+'. The activity involves '+material+'.',origin:'AI-foto; niet gebruiken als meetinstrument of telplaat.',status:'planned'});
 }
}
const jobs=[];
for(const [sector,label]of Object.entries(sectors))for(let s=1;s<=5;s++){
 const id=sector+'-'+s,group=records.filter(r=>r.sheet===id);
 const prompt='Create ONE photographic contact sheet with EXACTLY 16 DIFFERENT professional documentary photographs. A strict edge-to-edge 4 by 4 grid, all cells exactly equal, no margins, no gutters, no borders. Landscape overall aspect ratio 3:2, maximum detail; each individual tile is a landscape photograph. Each tile is an independent scene, NOT variations of a single photo. Read row by row left to right. These photos will be technically sliced into 16 individual lesson assets. Sector: '+label+'. Natural contemporary Dutch workplaces, believable materials, real textures, mundane authentic work, clean but not staged or glossy. Adult workers only, realistic anatomy and tools, concentrate on objects and hands or backs, no recognisable faces. Different camera views and locations across tiles. NO graphic design, NO captions, NO collage within a tile, NO readable text, numbers, signs, branding, price tags, graph lines, measurement graduations, clocks, worksheets, logos or watermarks. Do not render money or quantitative diagrams. Partial consignments may extend beyond the frame: these photos illustrate the job and will NOT be used for counting exact quantities. Correct distinct scene for EVERY tile:\n'+group.map((r,i)=>(i+1)+'. '+r.scene).join('\n');
 jobs.push({id,prompt,ids:group.map(r=>r.id),status:'planned'});
}
await mkdir(resolve(root,'assets/photo-bank/images'),{recursive:true});
await writeFile(resolve(root,'assets/photo-bank/manifest.json'),JSON.stringify({version:1,date:'2026-11-20',count:records.length,description:'400 eigen beroepsfoto’s bij 80 prioritaire lesonderwerpen, verdeeld over vijf sectoren. Rekenwaarden en tekeningen staan los van de foto.',images:records},null,2));
await writeFile(resolve(root,'assets/photo-bank/generation-jobs.json'),JSON.stringify(jobs,null,2));
console.log('Prepared '+records.length+' distinct scenes and '+jobs.length+' generation sheets. Priority 1: '+records.filter(r=>r.priority===1).length+'; priority 2: '+records.filter(r=>r.priority===2).length+'.');
